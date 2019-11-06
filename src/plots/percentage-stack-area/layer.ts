import * as _ from '@antv/util';
import { registerPlotType } from '../../base/global';
import StackArea, { StackAreaLayerConfig } from '../stack-area/layer';

export interface PercentageStackAreaLayerConfig extends StackAreaLayerConfig {}

export default class PercentageStackAreaLayer extends StackArea {
  public type: string = 'percentageStackArea';

  protected processData(originData?: object[]) {
    const props = this.options;
    const { xField, yField } = props;
    // 百分比堆叠面积图需要对原始数据进行预处理
    // step1: 以xField为单位，对yField做聚合
    const plotData = [];
    const sum = {};
    _.each(originData, (d) => {
      const sumField = d[xField];
      if (!_.has(sum, sumField)) {
        sum[sumField] = 0;
      }
      sum[sumField] += d[yField];
    });
    // step2: 获取每一条数据stackField的值在对应xField数值总和的占比
    _.each(originData, (d) => {
      const total = sum[d[xField]];
      const d_copy = _.clone(d);
      d_copy[yField] = d[yField] / total;
      d_copy._origin = d;
      d_copy.total = total;
      plotData.push(d_copy);
    });

    return plotData;
  }
}

registerPlotType('percentageStackArea', PercentageStackAreaLayer);
