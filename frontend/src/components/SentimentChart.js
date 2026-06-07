import React from 'react';
import Plot from 'react-plotly.js';

const ELECTRIC = '#6ee7f7';
const CORAL = '#ff6b8a';
const NAVY2 = '#111827';
const NAVY3 = '#0a0f1e';
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

  // Separate heatmap data by sentiment for clear differentiation
  const positiveData = sentimentData.filter(i => i.sentiment === 'POSITIVE');
  const negativeData = sentimentData.filter(i => i.sentiment === 'NEGATIVE');

  const uniqueDates = [...new Set(chartData.map(i => i.date))].sort();

  const avgConfByDateSentiment = (data, dateList) =>
    dateList.map(d => {
      const items = data.filter(i => new Date(i.timestamp).toLocaleDateString() === d);
      if (items.length === 0) return null;
      return parseFloat((items.reduce((a, b) => a + b.confidence, 0) / items.length).toFixed(3));
    });

  const posConf = avgConfByDateSentiment(positiveData, uniqueDates);
  const negConf = avgConfByDateSentiment(negativeData, uniqueDates);

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

      {/* Bar Chart — named traces so no "trace 0" */}
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

      {/* Heatmap — two clearly distinct rows with contrasting colors */}
      <ChartCard title="Confidence heatmap">
        <Plot
          data={[
            {
              x: uniqueDates,
              y: ['POSITIVE', 'NEGATIVE'],
              z: [posConf, negConf],
              type: 'heatmap',
              colorscale: [
                [0,   '#1a0a2e'],
                [0.2, '#3b1f5e'],
                [0.4, CORAL],
                [0.7, '#f9a825'],
                [1,   ELECTRIC],
              ],
              zmin: 0.8,
              zmax: 1.0,
              colorbar: {
                title: { text: 'Confidence', font: { color: TEXT_SEC, size: 11 }, side: 'right' },
                tickfont: { color: TEXT_MUT, size: 10 },
                thickness: 12,
                tickformat: '.0%',
              },
              hoverongaps: false,
            },
          ]}
          layout={{
            ...baseLayout,
            height: 260,
            margin: { t: 10, r: 80, b: 60, l: 80 },
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
