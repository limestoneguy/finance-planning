import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html'
})
export class GoalCardComponent {
  @Input() formGroup!: FormGroup;
  @Input() index!: number;
  @Output() deleteEvent = new EventEmitter<boolean>();
}
