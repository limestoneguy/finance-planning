import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { tap } from 'rxjs';
import FinancePlanner, { BreakupComponent, Expense, FinanceBreakUp, Goal, defaultFinancialBreakUp } from 'src/utils/FinancePlanner';
import InvestmentPlanner, { RiskTolerance } from 'src/utils/InvestmentPlanner';
import TaxPlanner from 'src/utils/TaxPlanner';

type financialBreakUpFormControl = { amount: FormControl<number>, name: FormControl<string>, isLocked: FormControl<boolean> }
type FormType = Partial<{
  salary: number | undefined;
  stopInvestmentAge?: number;
  isPreTax: boolean | undefined;
  retireAge?: number; expenses?: Expense[], goals: Goal[], withdrawals: Goal[], financialBreakUp: FinanceBreakUp, dateOfBirth: string
}>;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  step = 2;
  showInvestmentTable = false;
  userFormGroup: FormGroup = this.fb.group({
    salary: this.fb.control(1600000, { validators: [Validators.min(1500)] }),
    isPreTax: this.fb.control(true, {}),
    stopInvestmentAge: this.fb.control(undefined),
    retireAge: this.fb.control(45, [Validators.required]),
    dateOfBirth: this.fb.control(moment().subtract(25, 'years').toISOString().split('T').shift()),
    expenses: this.fb.array([]),
    goals: this.fb.array([]),
    withdrawals: this.fb.array([this.goalFormGroup]),
    financialBreakUp: this.fb.group(this.financialBreakupForm)
  });
  userFormGroupFinancialBreakUpOld?: FinanceBreakUp;
  financeObject?: { taxObject?: TaxPlanner, financeObject: FinancePlanner, investmentObject?: InvestmentPlanner };
  selectedLayout: 'table' | 'chart' = 'table';

  constructor(private fb: FormBuilder) {
  }

  home() { }

  ngOnInit(): void {
    this.userFormGroupFinancialBreakUpOld = this.userFormGroup.value.financialBreakUp as FinanceBreakUp;
    this.userFormGroup.valueChanges
      .pipe(tap((val: FormType) => {
        const breakUp = val.financialBreakUp;
        if (!breakUp) return
        Object.entries(breakUp).forEach(([key, breakupComponent]) => {
          const financialBreakUpFormGroup = this.userFormGroup.controls['financialBreakUp'] as FormGroup;
          if (breakupComponent.isLocked) {
            (financialBreakUpFormGroup.controls[key] as FormGroup).controls['amount'].disable({ emitEvent: false });
          } else {
            (financialBreakUpFormGroup.controls[key] as FormGroup).controls['amount'].enable({ emitEvent: false });
          }
        })
      }))
      .subscribe((val) => { this.calculateUserFinance(val) });
    this.calculateUserFinance(this.userFormGroup.value);
  }

  calculateUserFinance(formValue: FormType) {
    formValue = this.userFormGroup.getRawValue();
    if (!this.userFormGroup?.valid) return
    if (formValue.salary === null || formValue.isPreTax === null) return;
    const taxObject = this.getTaxObject(formValue)
    const financeObject = this.getFinanceObject(formValue, taxObject);
    const investmentObject = this.getInvestmentObject(financeObject, formValue);
    this.financeObject = { financeObject, taxObject, investmentObject }
    this.userFormGroup.patchValue({ financialBreakUp: financeObject.financeBreakup }, { emitEvent: false });
  }

  getInvestmentObject(financeObject: FinancePlanner, formValue: FormType) {
    const investmentObject = new InvestmentPlanner({ amount: financeObject.investmentAmount, dob: formValue.dateOfBirth ?? '1997-03-22', riskTolerance: RiskTolerance.LOW, retireAge: formValue.retireAge })
    formValue.withdrawals?.forEach(val => investmentObject.addWithdrawal(val));
    if (formValue.stopInvestmentAge) {
      investmentObject.stopInvestmentAge = formValue.stopInvestmentAge;
    }
    return investmentObject;
  }

  getTaxObject(formValue: FormType) {
    const taxObject = formValue.isPreTax && new TaxPlanner({ grossSalary: formValue.salary });
    return taxObject === false ? undefined : taxObject;
  }

  getFinanceObject(formValue: FormType, taxObject?: TaxPlanner | false) {
    const financeObject = taxObject ? new FinancePlanner({ monthlySalary: taxObject.inHandSalary / 12 }) : new FinancePlanner({ monthlySalary: (formValue.salary ?? 0) / 12 });
    formValue.expenses?.forEach(val => financeObject.addExpense(val));
    formValue.goals?.forEach(val => financeObject.addGoal(val));
    const newFinancialBreakUp = this.getFinancialBreakUp(formValue.financialBreakUp);
    if (newFinancialBreakUp) {
      try {
        financeObject.financeBreakup = newFinancialBreakUp;
        this.userFormGroup.patchValue({ financialBreakUp: newFinancialBreakUp }, { emitEvent: false });
      } catch (error) {
        if (!newFinancialBreakUp.wants.isLocked) {
          newFinancialBreakUp.wants.amount = 100 - newFinancialBreakUp.investments.amount - newFinancialBreakUp.needs.amount;
        } else {
          newFinancialBreakUp.investments.amount = 100 - newFinancialBreakUp.wants.amount - newFinancialBreakUp.needs.amount;
        }
      }
    }
    return financeObject;
  }

  addFormArrayElement(controlName: string) {
    const formArray = this.userFormGroup.controls[controlName] as FormArray | undefined;
    let formGroup: FormGroup | undefined = undefined;
    if (controlName === 'expenses') formGroup = this.expenseFormGroup;
    else if (['goals', 'withdrawals'].includes(controlName)) formGroup = this.goalFormGroup;
    if (formGroup)
      formArray?.push(formGroup);
  }

  get expenseFormGroup() {
    return this.fb.group({
      amount: 0,
      name: '',
      description: '',
      occurence: 'Monthly',
    });
  }

  get goalFormGroup() {
    return this.fb.group({
      amount: 0,
      name: '',
      goalDate: '',
    });
  }

  removeFormArrayElement(index: number, controlName: string) {
    const expenses = this.userFormGroup.controls[controlName] as FormArray | undefined;
    expenses?.removeAt(index)
  }

  get financialBreakupForm() {
    return Object.entries(defaultFinancialBreakUp).reduce((rootacc, [key, value]) => {
      rootacc[key] = this.fb.group(Object.entries(value).reduce((acc, [key, value]) => { acc[key] = this.fb.control(value); return acc }, {} as Record<string, any>));
      return rootacc
    }, {} as Record<string, any>);
  }

  get expenseFormGroupArray() {
    return this.userFormGroup.controls['expenses'] as FormArray<FormGroup<{ name: FormControl<string>, amount: FormControl<number>, description: FormControl<string>, occurence: FormControl<'Monthly' | 'Annually'> }>>;
  }

  get goalsFormGroup() {
    return this.userFormGroup.controls['goals'] as FormArray<FormGroup<{ name: FormControl<string>, amount: FormControl<number>, goalDate: FormControl<string> }>>;
  }

  get withdrawalsFormGroup() {
    return this.userFormGroup.controls['withdrawals'] as FormArray<FormGroup<{ name: FormControl<string>, amount: FormControl<number>, goalDate: FormControl<string> }>>;
  }

  get financialBreakupFormGroup() {
    return this.userFormGroup.controls['financialBreakUp'] as FormGroup<{ needs: FormGroup<financialBreakUpFormControl>, wants: FormGroup<financialBreakUpFormControl>, investments: FormGroup<financialBreakUpFormControl> }>
  }

  getFinancialBreakUp(newValue?: FinanceBreakUp) {
    if (!newValue) {
      return undefined;
    }


    const changeValue = Object.entries(newValue).reduce((rootAcc, [key, newValue]) => {
      const temp = this.userFormGroupFinancialBreakUpOld as Record<string, BreakupComponent>
      if (temp[key].amount !== newValue.amount) {
        rootAcc.aspect = key;
        rootAcc.delta = newValue.amount < temp[key].amount ? this.step : this.step * -1;
      }
      return rootAcc;
    }, { aspect: '', delta: 0 });

    if (isNaN(changeValue.delta)) {
      return undefined;
    }


    const halfDelta = Math.round((Math.abs(changeValue.delta) / 2) - .2) * changeValue.delta < 1 ? -1 : 1;
    switch (changeValue['aspect']) {
      case 'needs':
        if (newValue.wants.isLocked) {
          newValue.investments.amount += changeValue.delta;
        } else if (newValue.investments.isLocked) {
          newValue.wants.amount += changeValue.delta;
        } else {
          newValue.wants.amount += halfDelta;
          newValue.investments.amount += halfDelta;
        }
        break;
      case 'wants':
        if (newValue.needs.isLocked) {
          newValue.investments.amount += changeValue.delta
        } else if (newValue.investments.isLocked) {
          newValue.needs.amount += changeValue.delta
        } else {
          newValue.needs.amount += halfDelta
          newValue.investments.amount += halfDelta
        }
        break;
      case 'investments':
        if (newValue.wants.isLocked) {
          newValue.needs.amount += changeValue.delta
        } else if (newValue.needs.isLocked) {
          newValue.wants.amount += changeValue.delta
        } else {
          newValue.wants.amount += halfDelta
          newValue.needs.amount += halfDelta
        }
        break;
    }
    this.userFormGroupFinancialBreakUpOld = JSON.parse(JSON.stringify(newValue));
    return newValue;
  }
}
