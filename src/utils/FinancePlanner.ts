import * as moment from "moment"

export type Expense = {
  amount: number
  name: string
  description?: string
  occurence: 'Monthly' | 'Annually'
}

export type FinanceBreakUp = {
  needs: BreakupComponent;
  wants: BreakupComponent;
  investments: BreakupComponent;
}

export const defaultFinancialBreakUp: FinanceBreakUp = {
  needs: { amount: 50, name: '', isLocked: false },
  wants: { amount: 30, name: '', isLocked: false },
  investments: { amount: 20, name: '', isLocked: false },
}

export type BreakupComponent = {
  amount: number;
  name?: string;
  isLocked: boolean
}

export type Goal = {
  name?: string;
  amount: number;
  goalDate: string;
}

export default class FinancePlanner {
  private _total_salary: number;
  private _emiArr: Expense[] = [];
  private _goals: Goal[] = [];
  private _financeBreakup: FinanceBreakUp = defaultFinancialBreakUp;

  public constructor(props: { monthlySalary: number }) {
    this._total_salary = props.monthlySalary;
  }

  public addExpense(emi: Expense) {
    const totalEmi = this.monthlyNeedExpense + (emi.occurence === 'Monthly' ? emi.amount : emi.amount / 12);
    if (totalEmi > this.needsAmount) {
      throw new Error('EMI cannot be greater than needs salary');
    }
    this._emiArr.push(emi);
    return this;
  }

  public addGoal(goal: Goal) {
    this._goals.push(goal);
    return this;
  }

  public get needsAmount() {
    return Math.floor(this._total_salary * this.needs_factor);
  }

  public get wantsAmount() {
    return Math.floor(this._total_salary * this.wants_factor);
  }

  public get investmentAmount() {
    return Math.floor(this._total_salary * this.investment_factor);
  }

  public get monthlyNeedExpense() {
    return this._emiArr.reduce((acc, val) => acc + (val.occurence === 'Monthly' ? val.amount : val.amount / 12), 0);
  }

  public get monthlyWantExpense() {
    return this._goals.reduce((acc, val) => {
      const monthsRemaining = moment(val.goalDate).diff(moment(), 'months');
      console.log(monthsRemaining);
      return acc + (val.amount / monthsRemaining)
    }, 0);
  }

  public get needAmountAfterExpense() {
    return Math.floor(this.needsAmount - this.monthlyNeedExpense);
  }

  public get wantAmountAfterExpense() {
    return Math.floor(this.wantsAmount - this.monthlyWantExpense);
  }

  public set financeBreakup(breakUp: FinanceBreakUp) {
    this._financeBreakup = breakUp;
  }


  private get needs_factor() {
    return this._financeBreakup.needs.amount / 100;
  }

  private get wants_factor() {
    return this._financeBreakup.wants.amount / 100;
  }

  private get investment_factor() {
    return this._financeBreakup.investments.amount / 100;
  }

  public get toJSON() {
    return {
      needAmountAfterExpense: this.needAmountAfterExpense,
      wantAmountAfterExpense: this.wantAmountAfterExpense,
      needAmount: this.needsAmount,
      wantAmount: this.wantsAmount,
      investmentAmount: this.investmentAmount,
      monthly_salary: Math.floor(this._total_salary),
      expenses: this._emiArr,
      goals: this._goals,
      financeBreakUp: this._financeBreakup,
    };
  }


}