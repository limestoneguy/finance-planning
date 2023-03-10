import * as moment from "moment";
import { Moment } from "moment";
import { Goal } from "./FinancePlanner";

export enum RiskTolerance {
    LOW,
    MEDIUM,
    HIGH,
}

export type YearlyPlan = {
    assetAllocation: {
        bonds: number;
        stocks: number;
    },
    annualInvestment: number,
    currentAge: number,
    bond: { investment: number, interest: number },
    stocks: { investment: number, interest: number },
    epf: { investment: number, interest: number },
    retireAmount: number
    withdrawal?: Goal
}


export default class InvestmentPlanner {
    private _dob: Moment;
    private _amount: number
    private _riskTolerance: RiskTolerance
    private _retireAge: number;
    private _lumpsumAmount = 0;
    private _stopInvestmentAge = 0;
    private _adjustForInflation = false;
    private _assetInterestRate = {
        STOCKS: [
            -0.1746,   // 2002
            0.7318,   // 2003
            0.1329,   // 2004
            0.4216,   // 2005
            0.4671,   // 2006
            0.4715,   // 2007
            -0.5245,   // 2008
            0.8103,   // 2009
            0.1743,   // 2010
            -0.2463,   // 2011
            0.2570,   // 2012
            0.0919,   // 2013
            0.2989,   // 2014
            -0.0503,   // 2015
            0.0265,   // 2016
            0.2791,   // 2017
            0.0591,   // 2018
            0.1438,   // 2019
            -0.0365,   // 2020
            0.2747    // 2021
        ],
        BONDS: 0.09,
        EPF: 0.08,
        INFLATION: 0.05,
    }
    private _epfYearlyContribution: number;
    private _withdrawals: Goal[] = [];
    constructor(props: {
        dob: string,
        amount: number,
        adjustForInflation?: boolean,
        riskTolerance: RiskTolerance, retireAge?: number, lumpsumAmount?: number, epfAmount?: number
    }) {
        const dateObject = new Date(props.dob);
        this._retireAge = props.retireAge ?? 60;
        const userDateObject = moment(dateObject);
        if (moment().diff(userDateObject, 'years') > this._retireAge) {
            throw new Error('You are too old to use this shit');
        }
        this._lumpsumAmount = props.lumpsumAmount ?? 0
        this._dob = userDateObject;
        this._amount = props.amount;
        this._riskTolerance = props.riskTolerance;
        this._epfYearlyContribution = props.epfAmount ?? 0;
        this._adjustForInflation = props.adjustForInflation ?? this._adjustForInflation;
    }

    public get assetAllocation() {
        let ageRange = Math.round(this.age / 10 - .3) * 10
        return this._assetAllocation(ageRange);
    }

    private _assetAllocation(age: number) {
        let bonds = 0;
        switch (this._riskTolerance) {
            case RiskTolerance.LOW:
                bonds = age
                break;
            case RiskTolerance.MEDIUM:
                bonds = age - 10;
                break;
            case RiskTolerance.HIGH:
                bonds = age - 20;
                break;
            default:
                break;
        }

        return { bonds, stocks: 100 - bonds }
    }

    public addWithdrawal(wInfo: Goal) {
        this._withdrawals.push(wInfo);
        return this;
    }

    public get withdrawal() {
        return this._withdrawals;
    }

    public get retireAmount() {
        return this.investmentYearlyPlan.pop()?.retireAmount;
    }

    public get investmentYearlyPlan() {
        let retireAmount = this._lumpsumAmount;
        let currentAge = this.age;
        let bondInvestment = 0;
        let stocksInvestment = 0;
        let epfInvestment = 0;
        const yearlyPlan: YearlyPlan[] = [];

        while (currentAge < this._retireAge) {
            const currentAgeRange = Math.round(currentAge / 10 - .3) * 10
            const currentAssetAllocation = this._assetAllocation(currentAgeRange)
            const annualInvestment = this._stopInvestmentAge > 0 && this._stopInvestmentAge <= currentAge ? 0 : ((this._amount * 12) - this._epfYearlyContribution);
            bondInvestment = (bondInvestment + (annualInvestment * (currentAssetAllocation.bonds / 100)));
            stocksInvestment = (stocksInvestment + (annualInvestment * (currentAssetAllocation.stocks / 100)))
            epfInvestment += this._epfYearlyContribution;
            const checkWithdrawalYear = new Date().getFullYear() - this.age - 1 + currentAge;
            let withdrawal = this._withdrawals.find(val => moment(val.goalDate).year() === checkWithdrawalYear);
            if (withdrawal) {
                if (withdrawal.amount > stocksInvestment + bondInvestment) throw new Error("Withdrawal amount greater than investment amount");
                stocksInvestment -= withdrawal.amount;
                if (stocksInvestment < 0) {
                    bondInvestment += stocksInvestment;
                    stocksInvestment = 0;
                }
            }
            const epfInterest = this.assetInterestRate.EPF * epfInvestment;
            const bondInterest = this.assetInterestRate.BONDS * bondInvestment;
            const stocksInterest = this.assetInterestRate.STOCKS[(currentAge - this.age) % this.assetInterestRate.STOCKS.length] * stocksInvestment;
            retireAmount = bondInvestment + bondInterest + stocksInvestment + stocksInterest + epfInvestment + epfInterest;
            yearlyPlan.push({
                assetAllocation: currentAssetAllocation,
                annualInvestment,
                currentAge,
                bond: { investment: bondInvestment, interest: bondInterest },
                stocks: { investment: stocksInvestment, interest: stocksInterest },
                epf: { investment: epfInvestment, interest: epfInterest },
                retireAmount,
                withdrawal
            });
            bondInvestment += bondInterest;
            stocksInvestment += stocksInterest;
            epfInvestment += epfInterest;
            currentAge++;
        }
        return yearlyPlan;
    }

    public get assetInterestRate(): typeof this._assetInterestRate {
        const returnValue = { ...this._assetInterestRate };
        if (!this._adjustForInflation) {
            return returnValue
        }

        returnValue.BONDS = (((1 + this._assetInterestRate.BONDS) / (this._assetInterestRate.INFLATION + 1)) - 1)
        returnValue.EPF = (((1 + this._assetInterestRate.EPF) / (this._assetInterestRate.INFLATION + 1)) - 1)
        returnValue.STOCKS = this._assetInterestRate.STOCKS.map(val => (((1 + val) / (this._assetInterestRate.INFLATION + 1)) - 1))
        return returnValue;
    }

    set stopInvestmentAge(stopAge: number) {
        if (stopAge < this.age) throw new Error('You cannot stop before you invest');
        this._stopInvestmentAge = stopAge;
    }

    public get epfYearlyInvestment() {
        return this._epfYearlyContribution
    }

    public get age() {
        return moment().diff(this._dob, 'years');
    }

    public get toJSON() {
        return {
            assetAllocation: this.assetAllocation,
            amount: this._amount,
            retireAmount: this.retireAmount,
            investmentYearlyPlan: this.investmentYearlyPlan,
            withdrawal: this.withdrawal
        };
    }
}