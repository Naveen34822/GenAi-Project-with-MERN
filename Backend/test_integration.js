const fs = require("fs");
const path = require("path");

async function runTests() {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const username = `testuser_${randomSuffix}`;
  const email = `testuser_${randomSuffix}@example.com`;
  const password = "password123";

  console.log(`Starting Integration Tests for User: ${email}`);

  // 1. Register User
  const regResponse = await fetch("http://localhost:5050/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const regData = await regResponse.json();
  if (!regResponse.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  console.log("✓ Registration successful!");
  const token = regData.token;

  // 2. Generate Interview Plan (calling ai.service / Gemini)
  console.log("Generating Interview Plan via Gemini...");
  const intResponse = await fetch("http://localhost:5050/api/interview/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jobDescription: "React and Node.js Developer who builds clean APIs and user interfaces.",
      selfDescription: "I have 3 years of experience in JavaScript development.",
    }),
  });
  const intData = await intResponse.json();
  if (!intResponse.ok) {
    throw new Error(`Interview plan generation failed: ${JSON.stringify(intData)}`);
  }
  console.log("✓ Interview plan generated successfully!");
  console.log(`  Plan Title: "${intData.interviewReport.title}"`);
  console.log(`  Match Score: ${intData.interviewReport.matchScore}%`);
  console.log(`  Technical Questions Count: ${intData.interviewReport.technicalQuestions.length}`);

  // 3. Generate ATS Report (calling ats.service / Gemini)
  console.log("Generating ATS Report via Gemini...");
  const resumePath = process.env.TEST_RESUME_PATH || "./resume.pdf";
  if (!fs.existsSync(resumePath)) {
    throw new Error(`Resume PDF not found at: ${resumePath}. Set TEST_RESUME_PATH env var or place resume.pdf in Backend/`);
  }
  const fileBuffer = fs.readFileSync(resumePath);
  const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });

  const formData = new FormData();
  formData.append("jobDescription", "React and Node.js Developer with 5 years experience.");
  formData.append("resume", fileBlob, "resume.pdf");

  const atsResponse = await fetch("http://localhost:5050/api/ats/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const atsData = await atsResponse.json();
  if (!atsResponse.ok) {
    throw new Error(`ATS report generation failed: ${JSON.stringify(atsData)}`);
  }
  console.log("✓ ATS report generated successfully!");
  console.log(`  ATS Score: ${atsData.atsReport.atsScore}%`);
  console.log(`  Matched Keywords: ${JSON.stringify(atsData.atsReport.matchedKeywords)}`);
  console.log(`  Missing Keywords: ${JSON.stringify(atsData.atsReport.missingKeywords)}`);

  // 4. Evaluate Mock Interview Answer (calling evaluate service / Gemini)
  console.log("Evaluating Mock Interview Answer via Gemini...");
  const evalResponse = await fetch("http://localhost:5050/api/interview/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question: "How do you manage state in a large-scale React application?",
      userAnswer: "I usually use Context API, but for larger apps I prefer Redux Toolkit or Zustand because it keeps data flow predictable and clean.",
      intention: "To evaluate knowledge of state management libraries.",
      modelAnswer: "Context API for simple global UI state, Redux/Zundand for complex application logic."
    }),
  });
  const evalData = await evalResponse.json();
  if (!evalResponse.ok) {
    throw new Error(`Mock Interview Answer evaluation failed: ${JSON.stringify(evalData)}`);
  }
  console.log("✓ Answer evaluation test successful!");
  console.log(`  Grading Score: ${evalData.evaluation.score}/100`);
  console.log(`  Feedback: ${evalData.evaluation.feedback.substring(0, 80)}...`);
  console.log(`  Filler Words: ${JSON.stringify(evalData.evaluation.fillerWords)}`);

  // 5. Live AI Voice Chat Reply (calling chat service / Gemini)
  console.log("Generating Live Chat Reply via Gemini...");
  const chatResponse = await fetch("http://localhost:5050/api/interview/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      history: [
        { role: "model", text: "Hello! Welcome to your mock interview. Could you please introduce yourself?" },
        { role: "user", text: "Hi, I am Naveen, a developer with 3 years of experience building React and Node.js applications." }
      ],
      jobDescription: "React and Node.js Developer who builds clean APIs and user interfaces.",
      resume: "Naveen's profile: 3 years experience, skilled in React, Redux, Node.js, Express."
    }),
  });
  const chatData = await chatResponse.json();
  if (!chatResponse.ok) {
    throw new Error(`Live Chat reply generation failed: ${JSON.stringify(chatData)}`);
  }
  console.log("✓ Live Chat reply generation successful!");
  console.log(`  AI Reply: "${chatData.reply}"`);

  console.log("All Integration Tests Passed successfully! 🚀");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
