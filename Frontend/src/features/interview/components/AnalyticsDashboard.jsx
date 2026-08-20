import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = ({ reports }) => {
  // Process reports to get historical data
  const chartData = useMemo(() => {
    if (!reports || reports.length === 0) return [];

    // Sort reports chronologically (oldest to newest)
    const sortedReports = [...reports].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return sortedReports.map((report, index) => {
      // Calculate average score across all questions if atsScore isn't directly available on the root level
      let score = 0;
      if (report.atsScore) {
        score = report.atsScore;
      } else if (report.report && Array.isArray(report.report)) {
         const totalScore = report.report.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
         score = report.report.length > 0 ? Math.round((totalScore / (report.report.length * 10)) * 100) : 0;
      }

      return {
        name: `Int ${index + 1}`,
        score: score,
        role: report.jobPosition || "Interview",
        date: new Date(report.createdAt).toLocaleDateString()
      };
    });
  }, [reports]);

  if (chartData.length < 2) {
    return null; // Don't show chart if they only have 1 or 0 interviews
  }

  // Custom tooltip to match our glassmorphism theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(20, 24, 35, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '1rem',
          borderRadius: '8px',
          color: '#e6edf3'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#a5b4fc' }}>{payload[0].payload.role}</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>{payload[0].payload.date}</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', color: '#818cf8' }}>
            Score: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="analytics-dashboard" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', color: '#a5b4fc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📈</span> Performance Analytics
      </h2>
      
      <div className="glass-panel" style={{ padding: '1.5rem', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#818cf8" 
              strokeWidth={3}
              dot={{ fill: '#4f46e5', stroke: '#fff', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: '#fff', stroke: '#4f46e5' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
