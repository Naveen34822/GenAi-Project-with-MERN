const userModel = require("../models/user.model")

/**
 * FREE TIER LIMIT MIDDLEWARE
 *
 * This middleware runs BEFORE the interview report generation controller.
 * It checks: has this free user hit their 3 reports limit?
 *
 * HOW IT WORKS — 30-DAY ROLLING WINDOW:
 * 1. Fetch the user from DB
 * 2. If Pro → let them through (no limits)
 * 3. If Free:
 *    a. lastInterviewReset = date user took their FIRST free trial
 *    b. windowExpiresAt   = lastInterviewReset + 30 days
 *    c. If now > windowExpiresAt → 30 days passed → reset counter & start new window
 *    d. If count >= 3 → block with 403 + resetsAt date
 *    e. Otherwise → increment counter and let them through
 *
 * Example:
 *   User first generates on Sep 5  → lastInterviewReset = Sep 5
 *   Window expires                 → Oct 5 (30 days later, NOT Oct 1st)
 *   User tries on Sep 30           → still in window, count checked
 *   User tries on Oct 6            → new 30-day window starts, counter resets
 */
async function checkFreeLimit(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    // Pro users have no limits — skip all checks
    if (user.plan === "pro") {
      if (user.planExpiresAt && new Date() > user.planExpiresAt) {
        // Pro plan expired → downgrade to free, fall through to free check
        await userModel.findByIdAndUpdate(req.user.id, {
          plan: "free",
          planExpiresAt: null,
          razorpay_subscription_id: null
        })
      } else {
        return next() // ✅ Active Pro — no limits
      }
    }

    // ── FREE USER: 30-day rolling window ─────────────────────────────────────
    const now = new Date()
    const FREE_LIMIT = 3
    const WINDOW_MS = 30 * 24 * 60 * 60 * 1000  // 30 days in milliseconds

    const lastReset      = new Date(user.lastInterviewReset)
    const windowExpiresAt = new Date(lastReset.getTime() + WINDOW_MS)
    const isWindowExpired = now > windowExpiresAt

    if (isWindowExpired) {
      // 30 days have passed since the user's first/last trial reset
      // Start a brand new 30-day window from TODAY
      await userModel.findByIdAndUpdate(req.user.id, {
        interviewsThisMonth: 0,
        lastInterviewReset: now   // new window begins now
      })
      user.interviewsThisMonth = 0
    }

    if (user.interviewsThisMonth >= FREE_LIMIT) {
      // Recalculate windowExpiresAt in case we just reset (edge case safety)
      const freshLastReset = isWindowExpired ? now : lastReset
      const freshWindowExpiry = new Date(freshLastReset.getTime() + WINDOW_MS)

      return res.status(403).json({
        message: `You've used all ${FREE_LIMIT} free interview reports for this period.`,
        code: "FREE_LIMIT_REACHED",              // triggers 3D modal on frontend
        used: user.interviewsThisMonth,
        limit: FREE_LIMIT,
        resetsAt: freshWindowExpiry.toISOString(), // exact reset date/time
        upgradeTo: "pro"
      })
    }

    // Under the limit → atomically increment count and allow through
    await userModel.findByIdAndUpdate(req.user.id, {
      $inc: { interviewsThisMonth: 1 }
    })

    next() // ✅ Allowed
  } catch (err) {
    console.error("checkFreeLimit middleware error:", err)
    res.status(500).json({ message: "Failed to check plan limits." })
  }
}

/**
 * PRO ONLY MIDDLEWARE
 *
 * Use this on routes that are ONLY for Pro users (Live Voice, Video Interview).
 * Free users get a 403 with a special code the frontend uses to show a gate.
 */
async function requirePro(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id).select("plan planExpiresAt")

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    const isPro = user.plan === "pro" &&
      (!user.planExpiresAt || new Date() < user.planExpiresAt)

    if (!isPro) {
      return res.status(403).json({
        message: "This feature is only available on the Pro plan.",
        code: "PRO_REQUIRED", // Frontend uses this code to show upgrade prompt
        upgradeTo: "pro"
      })
    }

    next() // ✅ Pro user — let them through
  } catch (err) {
    console.error("requirePro middleware error:", err)
    res.status(500).json({ message: "Failed to verify plan." })
  }
}

module.exports = { checkFreeLimit, requirePro }
