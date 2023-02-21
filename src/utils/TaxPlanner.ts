export default class TaxPlanner {
  private _grossSalary?: number;
  private _tax = 0;
  private _isCessAdded = false;

  private taxSlabs: [number, number, number][] = [
    [0, 300000, 0],
    [300000, 600000, 0.05],
    [600000, 900000, 0.1],
    [900000, 1200000, 0.15],
    [1200000, 1500000, 0.2],
    [1500000, Infinity, 0.3],
  ];
  private standardDeduction = 50000;

  public constructor(props: { grossSalary?: number }) {
    if (props.grossSalary) {
      this._grossSalary = props.grossSalary;
    }
    this.calculateTax();
  }

  public set salary(grossSalary: number) {
    this._grossSalary = grossSalary;
    this._isCessAdded = false;
    this.calculateTax();
  }

  private calculateTax(): TaxPlanner {
    if (!this._grossSalary) throw new Error('Salary not defined');
    let income = this._grossSalary - this.standardDeduction;
    for (const slab of this.taxSlabs) {
      if (income <= 0) break;
      const [lower, upper, rate] = slab;
      const taxableAmount = Math.min(income, upper - lower);
      this._tax += taxableAmount * rate;
      income -= taxableAmount;
    }
    return this;
  }

  public addCess(): TaxPlanner {
    if (this._isCessAdded) return this;
    // calculate tax before rebate
    this._tax *= 1.04;
    this._isCessAdded = true;
    return this;
  }

  public removeCess() {
    if (!this._isCessAdded) return this;
    this._isCessAdded = false;
    this._tax *= 0.96;
    return this;
  }

  public get tax() {
    return this._tax;
  }

  public get grossSalary() {
    return this._grossSalary;
  }

  get chessAmount() {
    return this.isCessAdded ? this.tax - this.tax * 0.94 : this.tax * 0.04;
  }

  public get inHandSalary() {
    if (!this._grossSalary) throw new Error("Salary not defined");
    return this._grossSalary - this._tax;
  }

  public get isCessAdded() {
    return this._isCessAdded;
  }

  public set isCessAdded(isAdd: boolean) {
    if (isAdd === this._isCessAdded) return;
    this._isCessAdded = isAdd;
    if (this._isCessAdded) {
      this.addCess();
    } else {
      this.removeCess();
    }
  }


  public get toJSON() {
    return {
      isCessAdded: this.isCessAdded,
      tax: this.tax,
      grossSalary: this.grossSalary,
      inHandSalary: this.inHandSalary,
      cess: this.chessAmount,
    };
  }
}