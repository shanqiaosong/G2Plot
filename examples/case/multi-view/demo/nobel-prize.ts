// @ts-nocheck
import { DataView } from '@antv/data-set';
import { Lab } from '@antv/g2plot';
import { keys, groupBy } from '@antv/util';

function generateYearData() {
  const r = [];
  for (let i = 1900; i <= 2016; i++) {
    r.push({ year: i });
  }
  return r;
}

fetch('https://gw.alipayobjects.com/os/antfincdn/NHer2zyRYE/nobel-prize-data.json')
  .then((data) => data.json())
  .then((originalData) => {
    const data = [{ year: 1900, number: 0, age: 0 }, ...originalData.main, { year: 2016, number: 0, age: 0 }];
    let currentYear = 1901;
    const types = keys(groupBy(data, (d) => d.type));

    /** 散点图数据（各国诺贝尔奖获奖者的年龄分布） */
    const getPointViewData = (year) => {
      const r = data.map((d) => (d.year <= year ? d : { ...d, ageGroup: null })).filter((d) => d.age !== 0);
      const ds = new DataView().source(r);
      ds.transform({
        type: 'summary', // 别名 summary
        fields: ['number'], // 统计字段集
        operations: ['sum'], // 统计操作集
        as: ['number'], // 存储字段集
        groupBy: ['country', 'ageGroup', 'type'], // 分组字段集
      });
      return ds.rows;
    };

    /** 占比环图数据（各领域诺贝尔奖获奖分布） */
    const getIntervalViewData = (year) => {
      const ds = new DataView().source(data.map((d) => (d.year <= year ? d : { ...d, number: 0 })));
      const othersCnt = data.filter((d) => d.year > year).reduce((a, b) => a + b.number, 0);
      ds.transform({
        type: 'summary', // 别名 summary
        fields: ['number'], // 统计字段集
        operations: ['sum'], // 统计操作集
        as: ['counts'], // 存储字段集
        groupBy: ['type'], // 分组字段集
      });
      return [...ds.rows, { type: '其它', counts: othersCnt }];
    };

    const yearData = generateYearData();
    const labChart = new Lab.MultiView('container', {
      height: 500,
      padding: 'auto',
      appendPadding: [20, 0, 20, 0],
      legend: {
        type: { position: 'bottom' },
        number: false,
      },
      tooltip: {
        fields: ['country', 'age', 'number', 'ageGroup'],
        showMarkers: false,
        domStyles: {
          'g2-tooltip': {
            minWidth: '200px',
          },
          'g2-tooltip-list-item': {
            display: 'flex',
            justifyContent: 'space-between',
          },
        },
        customContent: (title, items) => {
          const datum = items[0]?.data || {};
          const fixed = (v) => v.toFixed(0);
          const tooltipItems = [
            { name: '年龄段：', value: `${fixed(Math.max(datum.ageGroup - 10, 0))}~${fixed(datum.ageGroup + 10)}` },
            { name: '奖项学科：', value: datum.type },
            { name: '获奖人数：', value: datum.number },
          ];
          let tooltipItemsStr = '';
          tooltipItems.forEach((item) => {
            tooltipItemsStr += `<li class="g2-tooltip-list-item">
               <span class="g2-tooltip-name">${item.name}</span>
               <span class="g2-tooltip-value">${item.value}</span>
             </li>`;
          });
          return `
             <div class="g2-tooltip-title">${title}</div>
             <ul class="g2-tooltip-list">${tooltipItemsStr}
             </ul>
          `;
        },
      },
      views: [
        {
          data: getIntervalViewData(currentYear),
          region: { start: { x: 0, y: 0.35 }, end: { x: 1, y: 0.65 } },
          coordinate: {
            type: 'theta',
            cfg: { innerRadius: 0.84, radius: 0.96 },
          },
          geometries: [
            {
              type: 'interval',
              yField: 'counts',
              colorField: 'type',
              mapping: {
                color: ({ type }) => {
                  const idx = types.indexOf(type);
                  const { colors10 = [] } = labChart.chart.getTheme();
                  return colors10[idx] || '#D9D9D9';
                },
              },
              adjust: { type: 'stack' },
            },
          ],
          annotations: [
            {
              type: 'text',
              content: 'G2Plot',
              position: ['50%', '50%'],
              style: {
                textAlign: 'center',
                fontWeight: 400,
                fontSize: 28,
              },
            },
          ],
        },
        {
          data: getPointViewData(currentYear),
          region: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
          coordinate: {
            type: 'polar',
            cfg: {
              innerRadius: 0.45,
              radius: 0.64,
            },
          },
          axes: {
            country: {
              tickLine: null,
              label: null,
            },
            ageGroup: {
              tickLine: null,
              min: 20,
              max: 100,
              tickInterval: 20,
              title: {
                text: '获奖\n年龄',
                autoRotate: false,
                offset: 12,
                style: { fontSize: 10, textBaseline: 'bottom' },
              },
              label: {
                offset: -4,
                style: {
                  textBaseline: 'bottom',
                  fontSize: 10,
                },
                formatter: (v) => (v === '100' ? '' : v),
              },
              grid: {
                line: {
                  style: {
                    lineWidth: 0.5,
                  },
                },
              },
            },
          },
          geometries: [
            {
              type: 'point',
              xField: 'country',
              yField: 'ageGroup',
              colorField: 'type',
              sizeField: 'number',
              adjust: {
                type: 'dodge',
              },
              mapping: {
                size: [2, 8],
                shape: 'circle',
                style: {
                  fillOpacity: 0.65,
                  lineWidth: 0,
                },
              },
            },
            {
              // 国家标签
              type: 'interval',
              xField: 'country',
              yField: '1',
              label: {
                labelEmit: true,
                fields: ['country'],
                offset: 50,
                style: {
                  fontSize: 10,
                },
              },
              mapping: {
                color: 'transparent',
              },
            },
          ],
        },
        {
          // 年度 label 展示
          data: yearData,
          region: {
            start: { x: 0.05, y: 0.05 },
            end: { x: 0.95, y: 0.95 },
          },
          axes: {
            year: {
              tickCount: 10,
              label: null,
              line: {
                style: {
                  lineWidth: 0.5,
                },
              },
            },
          },
          coordinate: { type: 'polar', cfg: { innerRadius: 0.99, radius: 1 } },
          geometries: [
            {
              type: 'line',
              xField: 'year',
              yField: '0.9',
              label: {
                labelEmit: true,
                content: ({ year }) => {
                  if (year === 1900) {
                    return ' ALL';
                  }
                  if (year === 2016) {
                    return '';
                  }
                  return Number(year) % 10 === 0 ? year : '-';
                },
              },
              mapping: {
                color: 'transparent',
              },
            },
            {
              type: 'interval',
              xField: 'year',
              yField: '1',
              label: {
                labelEmit: true,
                fields: ['year'],
                callback: (year) => {
                  const { defaultColor } = labChart.chart.getTheme();
                  return {
                    style: {
                      fill: year === currentYear ? 'rgba(255,255,255,0.85)' : 'transparent',
                    },
                    content: () => `${currentYear === 2016 ? ' ALL' : currentYear}`,
                    background: {
                      padding: 2,
                      // @ts-ignore
                      radius: 2,
                      style: {
                        fill: year === currentYear ? defaultColor : 'transparent',
                      },
                    },
                  };
                },
              },
              mapping: {
                color: 'transparent',
              },
            },
          ],
        },
      ],
    });

    labChart.render();
    // @ts-ignore
    window.chart = labChart;
    const dymaticView = labChart.chart.views[2];
    dymaticView.on('element:click', (evt) => {
      const data = evt.data?.data;
      if (data) {
        if (typeof data?.year === 'number') {
          currentYear = data.year;
          rerender(currentYear);
        }
      }
    });

    function rerender(y) {
      labChart.chart.views[0].changeData(getIntervalViewData(y));
      labChart.chart.views[1].changeData(getPointViewData(y));
      dymaticView.geometries[1].label('year', (year) => {
        const { defaultColor } = labChart.chart.getTheme();
        return {
          labelEmit: true,
          style: {
            fill: year === y ? 'rgba(255,255,255,0.85)' : 'transparent',
          },
          content: () => `${y === 2016 ? ' ALL' : y}`,
          background: {
            padding: 2,
            // @ts-ignore
            radius: 2,
            style: {
              fill: year === y ? defaultColor : 'transparent',
            },
          },
        };
      });
      dymaticView.render(true);
    }

    let interval;
    function start() {
      interval = setInterval(() => {
        if (currentYear !== 1900 && currentYear < 2016) {
          currentYear += 1;
          rerender(currentYear);
        } else {
          end();
        }
      }, 800);
    }
    function end() {
      clearInterval(interval);
      interval = null;
    }

    start();
  });
