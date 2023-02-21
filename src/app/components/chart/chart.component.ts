import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import InvestmentPlanner from 'src/utils/InvestmentPlanner';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  @Input() investmentObject?: InvestmentPlanner;
  public lineChartData?: ChartConfiguration<'line'>['data'];
  private lineChartDataInitValue: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'Stocks',
        fill: true,
        tension: 0.5,
      },
      {
        data: [],
        label: 'Bonds',
        fill: true,
        tension: 0.5,
      }
    ],
    labels: []
  };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true
  };
  public lineChartLegend = true;


  ngOnInit(): void {
    console.log(this.investmentObject);
    this.lineChartData = this.getLineCharData();
  }

  getLineCharData(): ChartConfiguration<'line'>['data'] | undefined {
    const chartOptions: ChartConfiguration<'line'>['data'] | undefined = this?.investmentObject?.investmentYearlyPlan.reduce((acc, val) => {
      // const [stocksDataSet, bondDataSet] = acc.datasets;
      acc.labels?.push(val.currentAge);
      acc.datasets[0].data.push(val.stocks.investment + val.stocks.interest);
      acc.datasets[1].data.push(val.bond.investment + val.bond.interest);
      return acc;
    }, this.lineChartDataInitValue);
    console.log(chartOptions, this?.investmentObject?.investmentYearlyPlan);
    return chartOptions;
  }

}
