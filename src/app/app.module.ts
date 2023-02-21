import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ExpenseCardComponent } from './components/expense-card/expense-card.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { GoalCardComponent } from './components/goal-card/goal-card.component';
import { TableComponent } from './components/table/table.component';
import { faChartLine, faInfoCircle, faTableCells, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ChartComponent } from './components/chart/chart.component';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [
    AppComponent,
    ExpenseCardComponent,
    CalendarComponent,
    GoalCardComponent,
    TableComponent,
    ChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTrashCan);
    library.addIcons(faInfoCircle);
    library.addIcons(faTimes);
    library.addIcons(faChartLine);
    library.addIcons(faTableCells);
  }
}
