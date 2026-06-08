import React from 'react';
import Plot from 'react-plotly.js';

const ELECTRIC = '#6ee7f7';
const CORAL = '#ff6b8a';
const NAVY2 = '#111827';
const TEXT_SEC = '#8896b3';
const TEXT_MUT = '#4a5568';

const baseLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'DM Sans, sans-serif', color: TEXT_SEC, size: 12 },
  margin: { t: 10, r: 16, b: 48, l: 48 },
  showlegend: true,
  legend: {
    font: { color: TEXT_SEC, size: 11 },
    bgcolor: 'transparent',
    bordercolor: 'transparent',
  },
  xaxis: {
    gridcolor: 'rgba(110,231,247,0.06)',
    linecolor: 'rgba(110,231,247,0.12)',
    tickfont: { color: TEXT_MUT, size: 11 },
    zerolinecolor: 'rgba(110,231,247,0.08)',
  },
  yaxis: {
    gridcolor: 'rgba(110,231,247,0.06)',
    linecolor: 'rgba(110,231,247,0.12)',
    tickfont: { color: TEXT_MUT, size: 11 },
    zerolinecolor: 'rgba(110,231,247,0.08)',
  },
};

const config = { displayModeBar: false, responsive: true };

const ChartCard = ({ title, children }) => (
  <div className="chart-item">
    <div className="chart-title">{title}</div>
    {children}
  </div>
);

const SentimentChart = ({ sentimentData }) => {
  const chartData = sentimentData.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    sentiment: item.sentiment,
    confidence: item.confidence,
  }));

  const sentimentDistribution = sentimentData.reduce(
    (acc, item) => {
      if (item.sentiment === 'POSITIVE') acc.positive++;
      else if (item.sentiment === 'NEGATIVE') acc.negative++;
      return acc;
    },
    { positive: 0, negative: 0 }
  );

  const sentimentByDate = sentimentData.reduce((acc, item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = { positive: 0, negative: 0 };
    if (item.sentiment === 'POSITIVE') acc[date].positive++;
    if (item.sentiment === 'NEGATIVE') acc[date].negative++;
    return acc;
  }, {});

  const dates = Object.keys(sentimentByDate);
  const positiveCounts = dates.map(d => sentimentByDate[d].positive);
  const negativeCounts = dates.map(d => sentimentByDate[d].negative);

  const positiveData = sentimentData.filter(i => i.sentiment === 'POSITIVE');
  const negativeData = sentimentData.filter(i => i.sentiment === 'NEGATIVE');

  const uniqueDates = [...new Set(chartData.map(i => i.date))].sort();

  const avgConfByDate = (data, dateList) =>
    dateList.map(d => {
      const items = data.filter(i => new Date(i.timestamp).toLocaleDateString() === d);
      if (items.length === 0) return null;
      return parseFloat((items.reduce((a, b) => a + b.confidence, 0) / items.length).toFixed(3));
    });

  const posConf = avgConfByDate(positiveData, uniqueDates);
  const negConf = avgConfByDate(negativeData, uniqueDates);

  // Build heatmap annotations to show values inside cells
  const annotations = [];
  uniqueDates.forEach((date, i) => {
    if (posConf[i] !== null) {
      annotations.push({
        x: date, y: 'POSITIVE',
        text: `${(posConf[i] * 100).toFixed(0)}%`,
        font: { color: '#0a0f1e', size: 11, family: 'DM Sans, sans-serif' },
        showarrow: false,
      });
    }
    if (negConf[i] !== null) {
      annotations.push({
        x: date, y: 'NEGATIVE',
        text: `${(negConf[i] * 100).toFixed(0)}%`,
        font: { color: '#0a0f1e', size: 11, family: 'DM Sans, sans-serif' },
        showarrow: false,
      });
    }
  });

  return (
    <div className="chart-container">

      {/* Line Chart */}
      <ChartCard title="Distribution over time">
        <Plot
          data={[
            {
              x: dates, y: positiveCounts,
              type: 'scatter', mode: 'lines+markers',
              name: 'Positive',
              line: { color: ELECTRIC, width: 2 },
              marker: { color: ELECTRIC, size: 6 },
            },
            {
              x: dates, y: negativeCounts,
              type: 'scatter', mode: 'lines+markers',
              name: 'Negative',
              line: { color: CORAL, width: 2 },
              marker: { color: CORAL, size: 6 },
            },
          ]}
          layout={{
            ...baseLayout,
            height: 260,
            xaxis: { ...baseLayout.xaxis, title: { text: 'Date', font: { color: TEXT_MUT, size: 11 } } },
            yaxis: { ...baseLayout.yaxis, title: { text: 'Count', font: { color: TEXT_MUT, size: 11 } } },
          }}
          config={config}
          style={{ width: '100%' }}
        />
      </ChartCard>

      {/* Donut Chart */}
      <ChartCard title="Sentiment proportions">
        <Plot
          data={[
            {
              labels: ['Positive', 'Negative'],
              values: [sentimentDistribution.positive, sentimentDistribution.negative],
              type: 'pie',
              hole: 0.55,
              marker: { colors: [ELECTRIC, CORAL] },
              textinfo: 'percent',
              textfont: { color: NAVY2, size: 12, family: 'DM Sans, sans-serif' },
              outsidetextfont: { color: TEXT_SEC },
            },
          ]}
          layout={{
            ...baseLayout,
            height: 260,
            margin: { t: 10, r: 16, b: 10, l: 16 },
            legend: {
              ...baseLayout.legend,
              orientation: 'h',
              x: 0.5, xanchor: 'center',
              y: -0.08,
            },
          }}
          config={config}
          style={{ width: '100%' }}
        />
      </ChartCard>

      {/* Bar Chart */}
      <ChartCard title="Sentiment counts">
        <Plot
          data={[
            {
              x: ['Positive'],
              y: [sentimentDistribution.positive],
              type: 'bar',
              name: 'Positive',
              marker: { color: ELECTRIC, opacity: 0.85 },
            },
            {
              x: ['Negative'],
              y: [sentimentDistribution.negative],
              type: 'bar',
              name: 'Negative',
              marker: { color: CORAL, opacity: 0.85 },
            },
          ]}
          layout={{
            ...baseLayout,
            height: 260,
            bargap: 0.5,
            showlegend: false,
            xaxis: { ...baseLayout.xaxis, title: { text: 'Sentiment', font: { color: TEXT_MUT, size: 11 } } },
            yaxis: { ...baseLayout.yaxis, title: { text: 'Count', font: { color: TEXT_MUT, size: 11 } } },
          }}
          config={config}
          style={{ width: '100%' }}
        />
      </ChartCard>

      {/* ✅ Heatmap — POSITIVE row teal, NEGATIVE row coral, values shown inside */}
      <ChartCard title="Confidence heatmap">
        <Plot
          data={[
            {
              x: uniqueDates,
              y: ['POSITIVE'],
              z: [posConf.map(v => v === null ? 0 : v * 100)],
              type: 'heatmap',
              colorscale: [
                [0,   '#051820'],
                [0.3, '#0e4d5e'],
                [0.6, '#0e9ab5'],
                [1,   ELECTRIC],
              ],
              zmin: 0,
              zmax: 100,
              showscale: false,
              hoverongaps: false,
              hovertemplate: 'Date: %{x}<br>Positive Confidence: %{z:.1f}%<extra></extra>',
            },
            {
              x: uniqueDates,
              y: ['NEGATIVE'],
              z: [negConf.map(v => v === null ? 0 : v * 100)],
              type: 'heatmap',
              colorscale: [
                [0,   '#200508'],
                [0.3, '#5e0e17'],
                [0.6, '#b5142a'],
                [1,   CORAL],
              ],
              zmin: 0,
              zmax: 100,
              showscale: false,
              hoverongaps: false,
              hovertemplate: 'Date: %{x}<br>Negative Confidence: %{z:.1f}%<extra></extra>',
            },
          ]}
          layout={{
            ...baseLayout,
            height: 260,
            margin: { t: 10, r: 30, b: 60, l: 90 },
            annotations,
            xaxis: {
              ...baseLayout.xaxis,
              title: { text: 'Date', font: { color: TEXT_MUT, size: 11 } },
            },
            yaxis: {
              ...baseLayout.yaxis,
              title: { text: 'Sentiment', font: { color: TEXT_MUT, size: 11 } },
              categoryorder: 'array',
              categoryarray: ['NEGATIVE', 'POSITIVE'],
              tickfont: { color: TEXT_SEC, size: 11 },
            },
          }}
          config={config}
          style={{ width: '100%' }}
        />
      </ChartCard>

    </div>
  );
};

export default SentimentChart;