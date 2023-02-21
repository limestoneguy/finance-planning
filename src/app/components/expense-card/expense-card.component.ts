import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormGroupName } from '@angular/forms';

@Component({
  selector: 'app-expense-card',
  templateUrl: './expense-card.component.html',
  styleUrls: ['./expense-card.component.scss']
})
export class ExpenseCardComponent {
  @Input() formGroup!: FormGroup;
  @Input() index!: number;
  @Output() deleteEvent = new EventEmitter<boolean>();
}
