import { Component, EventEmitter, Input, Output } from '@angular/core';
import InvestmentPlanner from 'src/utils/InvestmentPlanner';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @Input() investmentobject?: InvestmentPlanner;
}
