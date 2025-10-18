interface CalculatorState {
    currentValue: string;
    expression: string;
    memory: number;
    angleMode: 'deg' | 'rad' | 'grad';
    lastOperation: string | null;
    shouldResetInput: boolean;
    currentTheme: 'light' | 'dark';
    numberBase: 'bin' | 'oct' | 'dec' | 'hex';
    precision: number;
    history: HistoryItem[];
    currentTab: string;
}

interface HistoryItem {
    expression: string;
    result: string;
    timestamp: Date;
}

class ScientificCalculator {
    private state: CalculatorState;
    private displayElement: HTMLElement;
    private expressionElement: HTMLElement;
    private memoryElement: HTMLElement;
    private angleModeElement: HTMLElement;
    private themeToggle: HTMLElement;
    private numberBaseElement: HTMLElement;
    private precisionElement: HTMLElement;
    private displayFormatElement: HTMLElement;
    private historyPanel: HTMLElement;
    private historyList: HTMLElement;

    constructor() {
        this.state = {
            currentValue: '0',
            expression: '',
            memory: 0,
            angleMode: 'deg',
            lastOperation: null,
            shouldResetInput: false,
            currentTheme: 'dark',
            numberBase: 'dec',
            precision: 10,
            history: [],
            currentTab: 'basic'
        };

        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.loadHistory();
        this.updateDisplay();
        this.updateStatusBar();
        this.switchTab('basic');
        this.disableContextMenu();
        this.disableZoom();
    }
    
    private disableContextMenu(): void {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }
    
    private disableZoom(): void {
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });
        
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
            return false;
        });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    private initializeElements(): void {
        this.displayElement = document.getElementById('displayValue') as HTMLElement;
        this.expressionElement = document.getElementById('expressionDisplay') as HTMLElement;
        this.memoryElement = document.getElementById('memoryStatus') as HTMLElement;
        this.angleModeElement = document.getElementById('angleMode') as HTMLElement;
        this.themeToggle = document.getElementById('themeToggle') as HTMLElement;
        this.numberBaseElement = document.getElementById('numberBase') as HTMLElement;
        this.precisionElement = document.getElementById('precision') as HTMLElement;
        this.displayFormatElement = document.getElementById('displayFormat') as HTMLElement;
        this.historyPanel = document.getElementById('historyPanel') as HTMLElement;
        this.historyList = document.getElementById('historyList') as HTMLElement;
    }

    private bindEvents(): void {
        document.querySelectorAll('[data-number]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.inputNumber(target.dataset.number!);
            });
        });

        document.querySelectorAll('[data-operator]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.inputOperator(target.dataset.operator!);
            });
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.handleAction(target.dataset.action!, target.dataset.base);
            });
        });

        document.querySelectorAll('[data-function]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.handleScientific(target.dataset.function!);
            });
        });

        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                this.switchTab(target.dataset.tab!);
            });
        });

        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('closeHistory')!.addEventListener('click', () => {
            this.historyPanel.classList.add('hidden');
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    private inputNumber(num: string): void {
        if (this.state.shouldResetInput || this.state.currentValue === '0') {
            this.state.currentValue = num;
            this.state.shouldResetInput = false;
        } else {
            if (num === '.' && this.state.currentValue.includes('.')) {
                return;
            }
            this.state.currentValue += num;
        }
        
        this.updateDisplay();
        this.animateButton(`[data-number="${num}"]`);
    }

    private inputOperator(operator: string): void {
        if (this.state.expression !== '' && !this.state.shouldResetInput) {
            this.calculate();
        }

        this.state.expression = this.state.currentValue + ' ' + operator + ' ';
        this.state.shouldResetInput = true;
        this.updateDisplay();
        this.animateButton(`[data-operator="${operator}"]`);
    }

    private handleAction(action: string, base?: string): void {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'clearEntry':
                this.clearEntry();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'memoryClear':
                this.memoryClear();
                break;
            case 'memoryRecall':
                this.memoryRecall();
                break;
            case 'memoryAdd':
                this.memoryAdd();
                break;
            case 'memorySubtract':
                this.memorySubtract();
                break;
            case 'toggleAngle':
                this.toggleAngleMode();
                break;
            case 'toggleSign':
                this.toggleSign();
                break;
            case 'percent':
                this.percent();
                break;
            case 'precision':
                this.changePrecision();
                break;
            case 'history':
                this.showHistory();
                break;
            case 'setBase':
                if (base) this.setNumberBase(base as 'bin' | 'oct' | 'dec' | 'hex');
                break;
        }
        
        this.animateButton(`[data-action="${action}"]`);
    }

    private handleScientific(func: string): void {
        const value = this.parseCurrentValue();
        
        try {
            let result: number;
            let expression: string;

            switch (func) {
                case 'sin':
                    result = this.toRadians(value);
                    result = Math.sin(result);
                    expression = `sin(${value})`;
                    break;
                    
                case 'cos':
                    result = this.toRadians(value);
                    result = Math.cos(result);
                    expression = `cos(${value})`;
                    break;
                    
                case 'tan':
                    result = this.toRadians(value);
                    result = Math.tan(result);
                    expression = `tan(${value})`;
                    break;
                    
                case 'asin':
                    if (value < -1 || value > 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = Math.asin(value);
                    result = this.fromRadians(result);
                    expression = `sin⁻¹(${value})`;
                    break;
                    
                case 'acos':
                    if (value < -1 || value > 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = Math.acos(value);
                    result = this.fromRadians(result);
                    expression = `cos⁻¹(${value})`;
                    break;
                    
                case 'atan':
                    result = Math.atan(value);
                    result = this.fromRadians(result);
                    expression = `tan⁻¹(${value})`;
                    break;
                    
                case 'sinh':
                    result = Math.sinh(value);
                    expression = `sinh(${value})`;
                    break;
                    
                case 'cosh':
                    result = Math.cosh(value);
                    expression = `cosh(${value})`;
                    break;
                    
                case 'tanh':
                    result = Math.tanh(value);
                    expression = `tanh(${value})`;
                    break;
                    
                case 'asinh':
                    result = Math.asinh(value);
                    expression = `asinh(${value})`;
                    break;
                    
                case 'acosh':
                    if (value < 1) {
                        this.showError('Domain error: Input must be >= 1');
                        return;
                    }
                    result = Math.acosh(value);
                    expression = `acosh(${value})`;
                    break;
                    
                case 'atanh':
                    if (value <= -1 || value >= 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = Math.atanh(value);
                    expression = `atanh(${value})`;
                    break;
                    
                case 'log':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log10(value);
                    expression = `log(${value})`;
                    break;
                    
                case 'ln':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log(value);
                    expression = `ln(${value})`;
                    break;
                    
                case 'log2':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log2(value);
                    expression = `log₂(${value})`;
                    break;
                    
                case 'x2':
                    result = Math.pow(value, 2);
                    expression = `(${value})²`;
                    break;
                    
                case 'cube':
                    result = Math.pow(value, 3);
                    expression = `(${value})³`;
                    break;
                    
                case 'sqrt':
                    if (value < 0) {
                        this.showError('Domain error: Input must be non-negative');
                        return;
                    }
                    result = Math.sqrt(value);
                    expression = `√(${value})`;
                    break;
                    
                case 'cbrt':
                    result = Math.cbrt(value);
                    expression = `∛(${value})`;
                    break;
                    
                case 'power':
                    this.state.expression = this.state.currentValue + ' ^ ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'pi':
                    result = Math.PI;
                    expression = 'π';
                    break;
                    
                case 'e':
                    result = Math.E;
                    expression = 'e';
                    break;
                    
                case 'factorial':
                    if (!Number.isInteger(value) || value < 0) {
                        this.showError('Domain error: Input must be non-negative integer');
                        return;
                    }
                    result = this.factorial(value);
                    expression = `factorial(${value})`;
                    break;
                    
                case 'reciprocal':
                    if (value === 0) {
                        this.showError('Math error: Division by zero');
                        return;
                    }
                    result = 1 / value;
                    expression = `1/(${value})`;
                    break;
                    
                case 'power10':
                    result = Math.pow(10, value);
                    expression = `10^${value}`;
                    break;
                    
                case 'exp':
                    result = Math.exp(value);
                    expression = `e^${value}`;
                    break;
                    
                case 'abs':
                    result = Math.abs(value);
                    expression = `|${value}|`;
                    break;
                    
                case 'mod':
                    this.state.expression = this.state.currentValue + ' mod ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'rand':
                    result = Math.random();
                    expression = 'random()';
                    break;
                    
                case 'gcd':
                    this.state.expression = this.state.currentValue + ' gcd ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'lcm':
                    this.state.expression = this.state.currentValue + ' lcm ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'nCr':
                    this.state.expression = this.state.currentValue + ' nCr ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'nPr':
                    this.state.expression = this.state.currentValue + ' nPr ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'degrees':
                    result = value * 180 / Math.PI;
                    expression = `${value} rad to deg`;
                    break;
                    
                case 'radians':
                    result = value * Math.PI / 180;
                    expression = `${value} deg to rad`;
                    break;
                    
                case 'gradians':
                    result = value * 200 / 180;
                    expression = `${value} deg to grad`;
                    break;
                    
                case 'floor':
                    result = Math.floor(value);
                    expression = `floor(${value})`;
                    break;
                    
                case 'ceil':
                    result = Math.ceil(value);
                    expression = `ceil(${value})`;
                    break;
                    
                case 'round':
                    result = Math.round(value);
                    expression = `round(${value})`;
                    break;
                    
                case 'trunc':
                    result = Math.trunc(value);
                    expression = `trunc(${value})`;
                    break;
                    
                case 'hypot':
                    this.state.expression = this.state.currentValue + ' hypot ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'log1p':
                    if (value <= -1) {
                        this.showError('Domain error: Input must be > -1');
                        return;
                    }
                    result = Math.log1p(value);
                    expression = `log1p(${value})`;
                    break;
                    
                case 'expm1':
                    result = Math.expm1(value);
                    expression = `expm1(${value})`;
                    break;
                    
                case 'gamma':
                    result = this.gammaFunction(value);
                    expression = `Γ(${value})`;
                    break;
                    
                case 'erf':
                    result = this.errorFunction(value);
                    expression = `erf(${value})`;
                    break;
                    
                case 'erfc':
                    result = 1 - this.errorFunction(value);
                    expression = `erfc(${value})`;
                    break;
                    
                case 'mean':
                    this.state.expression = 'mean(' + this.state.currentValue + ')';
                    result = value;
                    break;
                    
                case 'median':
                    this.state.expression = 'median(' + this.state.currentValue + ')';
                    result = value;
                    break;
                    
                case 'bitwiseAnd':
                    this.state.expression = this.state.currentValue + ' & ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'bitwiseOr':
                    this.state.expression = this.state.currentValue + ' | ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'bitwiseXor':
                    this.state.expression = this.state.currentValue + ' ^ ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'bitwiseNot':
                    result = ~this.parseCurrentValueAsInt();
                    expression = `~${value}`;
                    break;
                    
                case 'bitwiseLeftShift':
                    this.state.expression = this.state.currentValue + ' << ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'bitwiseRightShift':
                    this.state.expression = this.state.currentValue + ' >> ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                case 'bitwiseZeroFillRightShift':
                    this.state.expression = this.state.currentValue + ' >>> ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                    
                default:
                    this.showError(`Function ${func} not implemented yet`);
                    return;
            }
            
            this.state.currentValue = this.formatNumber(result);
            this.state.expression = expression;
            this.state.shouldResetInput = true;
            this.updateDisplay();
            
        } catch (error) {
            this.showError('Calculation error');
        }
        
        this.animateButton(`[data-function="${func}"]`);
    }

    private calculate(): void {
        if (this.state.expression === '') return;

        try {
            let expr = this.state.expression + this.state.currentValue;
            
            expr = expr.replace(/×/g, '*')
                      .replace(/÷/g, '/')
                      .replace(/mod/g, '%')
                      .replace(/gcd/g, 'this.gcd')
                      .replace(/lcm/g, 'this.lcm')
                      .replace(/nCr/g, 'this.nCr')
                      .replace(/nPr/g, 'this.nPr')
                      .replace(/hypot/g, 'Math.hypot');
            
            let result = eval(expr);
            
            this.addToHistory(this.state.expression + this.state.currentValue, result);
            
            this.state.expression += this.state.currentValue + ' = ';
            this.state.currentValue = this.formatNumber(result);
            this.state.shouldResetInput = true;
            this.updateDisplay();
            
        } catch (error) {
            this.showError('Syntax error');
        }
    }

    private clear(): void {
        this.state.currentValue = '0';
        this.state.expression = '';
        this.state.shouldResetInput = false;
        this.updateDisplay();
    }

    private clearEntry(): void {
        this.state.currentValue = '0';
        this.updateDisplay();
    }

    private backspace(): void {
        if (this.state.currentValue.length > 1 && this.state.currentValue !== '0') {
            this.state.currentValue = this.state.currentValue.slice(0, -1);
        } else {
            this.state.currentValue = '0';
        }
        this.updateDisplay();
    }

    private toggleSign(): void {
        if (this.state.currentValue !== '0') {
            if (this.state.currentValue.startsWith('-')) {
                this.state.currentValue = this.state.currentValue.slice(1);
            } else {
                this.state.currentValue = '-' + this.state.currentValue;
            }
            this.updateDisplay();
        }
    }

    private percent(): void {
        const value = this.parseCurrentValue();
        this.state.currentValue = (value / 100).toString();
        this.updateDisplay();
    }

    private memoryClear(): void {
        this.state.memory = 0;
        this.updateStatusBar();
    }

    private memoryRecall(): void {
        this.state.currentValue = this.state.memory.toString();
        this.updateDisplay();
    }

    private memoryAdd(): void {
        this.state.memory += this.parseCurrentValue();
        this.updateStatusBar();
    }

    private memorySubtract(): void {
        this.state.memory -= this.parseCurrentValue();
        this.updateStatusBar();
    }

    private toggleAngleMode(): void {
        const modes: ('deg' | 'rad' | 'grad')[] = ['deg', 'rad', 'grad'];
        const currentIndex = modes.indexOf(this.state.angleMode);
        this.state.angleMode = modes[(currentIndex + 1) % modes.length];
        this.updateStatusBar();
    }

    private setNumberBase(base: 'bin' | 'oct' | 'dec' | 'hex'): void {
        this.state.numberBase = base;
        this.updateStatusBar();
        this.updateDisplayFormat();
        this.convertToBase(base);
    }

    private convertToBase(base: 'bin' | 'oct' | 'dec' | 'hex'): void {
        const value = this.parseCurrentValueAsInt();
        let newValue: string;
        
        switch (base) {
            case 'bin':
                newValue = value.toString(2);
                break;
            case 'oct':
                newValue = value.toString(8);
                break;
            case 'dec':
                newValue = value.toString(10);
                break;
            case 'hex':
                newValue = value.toString(16).toUpperCase();
                break;
            default:
                newValue = value.toString(10);
        }
        
        this.state.currentValue = newValue;
        this.updateDisplay();
    }

    private changePrecision(): void {
        this.state.precision = this.state.precision === 10 ? 15 : 10;
        this.updateStatusBar();
    }

    private showHistory(): void {
        this.renderHistory();
        this.historyPanel.classList.remove('hidden');
    }

    private addToHistory(expression: string, result: number): void {
        this.state.history.unshift({
            expression,
            result: this.formatNumber(result),
            timestamp: new Date()
        });
        
        if (this.state.history.length > 50) {
            this.state.history.pop();
        }
        
        this.saveHistory();
    }

    private renderHistory(): void {
        this.historyList.innerHTML = '';
        
        this.state.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.state.currentValue = item.result;
                this.updateDisplay();
                this.historyPanel.classList.add('hidden');
            });
            
            this.historyList.appendChild(historyItem);
        });
    }

    private toggleTheme(): void {
        this.state.currentTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
        this.updateThemeIcon();
    }

    private applyTheme(): void {
        document.documentElement.setAttribute('data-theme', this.state.currentTheme);
    }

    private updateThemeIcon(): void {
        const icon = this.themeToggle.querySelector('i') as HTMLElement;
        if (this.state.currentTheme === 'light') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    private loadTheme(): void {
        const savedTheme = localStorage.getItem('calculatorTheme') as 'light' | 'dark' | null;
        if (savedTheme) {
            this.state.currentTheme = savedTheme;
        }
        this.applyTheme();
        this.updateThemeIcon();
    }

    private saveTheme(): void {
        localStorage.setItem('calculatorTheme', this.state.currentTheme);
    }

    private loadHistory(): void {
        const savedHistory = localStorage.getItem('calculatorHistory');
        if (savedHistory) {
            this.state.history = JSON.parse(savedHistory);
        }
    }

    private saveHistory(): void {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.state.history));
    }

    private switchTab(tabName: string): void {
        this.state.currentTab = tabName;
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)!.classList.add('active');
        
        document.querySelectorAll('.buttons-grid').forEach(grid => {
            grid.classList.add('hidden');
        });
        document.getElementById(tabName + 'Tab')!.classList.remove('hidden');
    }

    private parseCurrentValue(): number {
        return parseFloat(this.state.currentValue);
    }

    private parseCurrentValueAsInt(): number {
        return parseInt(this.state.currentValue, 10);
    }

    private toRadians(value: number): number {
        switch (this.state.angleMode) {
            case 'deg':
                return value * Math.PI / 180;
            case 'grad':
                return value * Math.PI / 200;
            case 'rad':
            default:
                return value;
        }
    }

    private fromRadians(value: number): number {
        switch (this.state.angleMode) {
            case 'deg':
                return value * 180 / Math.PI;
            case 'grad':
                return value * 200 / Math.PI;
            case 'rad':
            default:
                return value;
        }
    }

    private factorial(n: number): number {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    private gammaFunction(x: number): number {
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        
        let g = 7;
        if (x < 0.5) {
            return Math.PI / (Math.sin(Math.PI * x) * this.gammaFunction(1 - x));
        }
        
        x -= 1;
        let a = p[0];
        let t = x + g + 0.5;
        
        for (let i = 1; i < p.length; i++) {
            a += p[i] / (x + i);
        }
        
        return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
    }

    private errorFunction(x: number): number {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    private gcd(a: number, b: number): number {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    private lcm(a: number, b: number): number {
        return Math.abs(a * b) / this.gcd(a, b);
    }

    private nCr(n: number, r: number): number {
        if (r < 0 || r > n) return 0;
        if (r === 0 || r === n) return 1;
        r = Math.min(r, n - r);
        let result = 1;
        for (let i = 1; i <= r; i++) {
            result = result * (n - i + 1) / i;
        }
        return Math.round(result);
    }

    private nPr(n: number, r: number): number {
        if (r < 0 || r > n) return 0;
        let result = 1;
        for (let i = 0; i < r; i++) {
            result *= (n - i);
        }
        return result;
    }

    private formatNumber(num: number): string {
        if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(this.state.precision - 1);
        }
        
        return parseFloat(num.toFixed(this.state.precision)).toString();
    }

    private showError(message: string): void {
        this.state.currentValue = 'Error';
        this.state.expression = message;
        this.updateDisplay();
        
        setTimeout(() => {
            this.clear();
        }, 2000);
    }

    private animateButton(selector: string): void {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (button) {
            button.classList.add('pressed');
            setTimeout(() => {
                button.classList.remove('pressed');
            }, 150);
        }
    }

    private updateDisplay(): void {
        this.displayElement.textContent = this.state.currentValue;
        this.expressionElement.textContent = this.state.expression;
    }

    private updateStatusBar(): void {
        this.angleModeElement.textContent = this.state.angleMode.toUpperCase();
        this.memoryElement.textContent = this.formatNumber(this.state.memory);
        this.numberBaseElement.textContent = this.state.numberBase.toUpperCase();
        this.precisionElement.textContent = this.state.precision.toString();
    }

    private updateDisplayFormat(): void {
        this.displayFormatElement.textContent = this.state.numberBase.toUpperCase();
    }

    private handleKeyboard(event: KeyboardEvent): void {
        const key = event.key;
        
        if ('0123456789.+-*/=EnterEscapeBackspace%'.includes(key)) {
            event.preventDefault();
        }

        if (key >= '0' && key <= '9') {
            this.inputNumber(key);
        }
        else if (key === '.') {
            this.inputNumber('.');
        }
        else if (['+', '-', '*', '/'].includes(key)) {
            this.inputOperator(key);
        }
        else if (key === 'Enter' || key === '=') {
            this.calculate();
        }
        else if (key === 'Escape') {
            this.clear();
        }
        else if (key === 'Backspace') {
            this.backspace();
        }
        else if (key === '%') {
            this.percent();
        }
        else if (key === 'Tab') {
            event.preventDefault();
            const tabs = ['basic', 'scientific', 'statistics', 'programming'];
            const currentIndex = tabs.indexOf(this.state.currentTab);
            const nextIndex = (currentIndex + 1) % tabs.length;
            this.switchTab(tabs[nextIndex]);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScientificCalculator();
});