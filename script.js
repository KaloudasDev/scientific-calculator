var ScientificCalculator = (function () {
    'use strict';

    function ScientificCalculator() {
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
            currentTab: 'basic',
            lastInput: null
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
    
    ScientificCalculator.prototype.disableContextMenu = function () {
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            return false;
        });
    };
    
    ScientificCalculator.prototype.disableZoom = function () {
        var preventDefault = function (e) {
            e.preventDefault();
            return false;
        };
        
        document.addEventListener('wheel', function (e) {
            if (e.ctrlKey) {
                preventDefault(e);
            }
        }, { passive: false });
        
        document.addEventListener('touchstart', function (e) {
            if (e.touches.length > 1) {
                preventDefault(e);
            }
        }, { passive: false });
        
        var lastTouchEnd = 0;
        document.addEventListener('touchend', function (e) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                preventDefault(e);
            }
            lastTouchEnd = now;
        }, false);
        
        document.addEventListener('gesturestart', preventDefault);
        document.addEventListener('gesturechange', preventDefault);
        document.addEventListener('gestureend', preventDefault);
    };

    ScientificCalculator.prototype.initializeElements = function () {
        this.displayElement = document.getElementById('displayValue');
        this.expressionElement = document.getElementById('expressionDisplay');
        this.memoryElement = document.getElementById('memoryStatus');
        this.angleModeElement = document.getElementById('angleMode');
        this.themeToggle = document.getElementById('themeToggle');
        this.numberBaseElement = document.getElementById('numberBase');
        this.precisionElement = document.getElementById('precision');
        this.displayFormatElement = document.getElementById('displayFormat');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
    };

    ScientificCalculator.prototype.bindEvents = function () {
        var _this = this;
        
        var safeQuerySelectorAll = function (selector) {
            try {
                return document.querySelectorAll(selector);
            } catch (e) {
                console.warn('Invalid selector:', selector);
                return [];
            }
        };

        safeQuerySelectorAll('[data-number]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var target = e.target.closest('[data-number]');
                if (target && target.dataset.number) {
                    _this.inputNumber(target.dataset.number);
                }
            });
        });

        safeQuerySelectorAll('[data-operator]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var target = e.target.closest('[data-operator]');
                if (target && target.dataset.operator) {
                    _this.inputOperator(target.dataset.operator);
                }
            });
        });

        safeQuerySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var target = e.target.closest('[data-action]');
                if (target && target.dataset.action) {
                    _this.handleAction(target.dataset.action, target.dataset.base);
                }
            });
        });

        safeQuerySelectorAll('[data-function]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var target = e.target.closest('[data-function]');
                if (target && target.dataset.function) {
                    _this.handleScientific(target.dataset.function);
                }
            });
        });

        safeQuerySelectorAll('[data-tab]').forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                var target = e.target.closest('[data-tab]');
                if (target && target.dataset.tab) {
                    _this.switchTab(target.dataset.tab);
                }
            });
        });

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', function () {
                _this.toggleTheme();
            });
        }

        var closeHistory = document.getElementById('closeHistory');
        if (closeHistory) {
            closeHistory.addEventListener('click', function () {
                _this.historyPanel.classList.add('hidden');
            });
        }

        document.addEventListener('keydown', function (e) { return _this.handleKeyboard(e); });
        
        window.addEventListener('beforeunload', function () {
            _this.cleanup();
        });
    };

    ScientificCalculator.prototype.cleanup = function () {
        document.removeEventListener('keydown', this.handleKeyboard);
    };

    ScientificCalculator.prototype.inputNumber = function (num) {
        if (this.state.shouldResetInput || this.state.currentValue === '0' || this.state.currentValue === 'Error') {
            this.state.currentValue = num;
            this.state.shouldResetInput = false;
        }
        else {
            if (num === '.' && this.state.currentValue.includes('.')) {
                return;
            }
            if (this.state.currentValue.length < 50) {
                this.state.currentValue += num;
            }
        }
        this.state.lastInput = 'number';
        this.updateDisplay();
        this.animateButton("[data-number=\"".concat(num, "\"]"));
    };

    ScientificCalculator.prototype.inputOperator = function (operator) {
        if (this.state.currentValue === 'Error') {
            this.clear();
            return;
        }

        if (this.state.expression !== '' && !this.state.shouldResetInput && this.state.lastInput !== 'operator') {
            this.calculate();
        }
        
        this.state.expression = this.state.currentValue + ' ' + operator + ' ';
        this.state.shouldResetInput = true;
        this.state.lastInput = 'operator';
        this.updateDisplay();
        this.animateButton("[data-operator=\"".concat(operator, "\"]"));
    };

    ScientificCalculator.prototype.handleAction = function (action, base) {
        if (this.state.currentValue === 'Error' && action !== 'clear' && action !== 'clearEntry') {
            return;
        }

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
                if (base) {
                    this.setNumberBase(base);
                }
                break;
        }
        this.state.lastInput = 'action';
        this.animateButton("[data-action=\"".concat(action, "\"]"));
    };

    ScientificCalculator.prototype.handleScientific = function (func) {
        if (this.state.currentValue === 'Error') {
            return;
        }

        var value = this.parseCurrentValue();
        if (isNaN(value)) {
            this.showError('Invalid input');
            return;
        }

        try {
            var result = void 0;
            var expression = void 0;
            
            switch (func) {
                case 'sin':
                    result = Math.sin(this.toRadians(value));
                    expression = "sin(".concat(value, ")");
                    break;
                case 'cos':
                    result = Math.cos(this.toRadians(value));
                    expression = "cos(".concat(value, ")");
                    break;
                case 'tan':
                    var tanVal = this.toRadians(value);
                    if (Math.abs(Math.cos(tanVal)) < 1e-10) {
                        this.showError('Math error: Undefined tangent');
                        return;
                    }
                    result = Math.tan(tanVal);
                    expression = "tan(".concat(value, ")");
                    break;
                case 'asin':
                    if (value < -1 || value > 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = this.fromRadians(Math.asin(value));
                    expression = "sin\u207B\u00B9(".concat(value, ")");
                    break;
                case 'acos':
                    if (value < -1 || value > 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = this.fromRadians(Math.acos(value));
                    expression = "cos\u207B\u00B9(".concat(value, ")");
                    break;
                case 'atan':
                    result = this.fromRadians(Math.atan(value));
                    expression = "tan\u207B\u00B9(".concat(value, ")");
                    break;
                case 'sinh':
                    result = Math.sinh(value);
                    expression = "sinh(".concat(value, ")");
                    break;
                case 'cosh':
                    result = Math.cosh(value);
                    expression = "cosh(".concat(value, ")");
                    break;
                case 'tanh':
                    result = Math.tanh(value);
                    expression = "tanh(".concat(value, ")");
                    break;
                case 'asinh':
                    result = Math.asinh(value);
                    expression = "asinh(".concat(value, ")");
                    break;
                case 'acosh':
                    if (value < 1) {
                        this.showError('Domain error: Input must be >= 1');
                        return;
                    }
                    result = Math.acosh(value);
                    expression = "acosh(".concat(value, ")");
                    break;
                case 'atanh':
                    if (value <= -1 || value >= 1) {
                        this.showError('Domain error: Input must be between -1 and 1');
                        return;
                    }
                    result = Math.atanh(value);
                    expression = "atanh(".concat(value, ")");
                    break;
                case 'log':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log10(value);
                    expression = "log(".concat(value, ")");
                    break;
                case 'ln':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log(value);
                    expression = "ln(".concat(value, ")");
                    break;
                case 'log2':
                    if (value <= 0) {
                        this.showError('Domain error: Input must be greater than 0');
                        return;
                    }
                    result = Math.log2(value);
                    expression = "log\u2082(".concat(value, ")");
                    break;
                case 'x2':
                    result = Math.pow(value, 2);
                    expression = "(".concat(value, ")\u00B2");
                    break;
                case 'cube':
                    result = Math.pow(value, 3);
                    expression = "(".concat(value, ")\u00B3");
                    break;
                case 'sqrt':
                    if (value < 0) {
                        this.showError('Domain error: Input must be non-negative');
                        return;
                    }
                    result = Math.sqrt(value);
                    expression = "\u221A(".concat(value, ")");
                    break;
                case 'cbrt':
                    result = Math.cbrt(value);
                    expression = "\u221B(".concat(value, ")");
                    break;
                case 'power':
                    this.state.expression = this.state.currentValue + ' ^ ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                case 'pi':
                    result = Math.PI;
                    expression = '\u03C0';
                    break;
                case 'e':
                    result = Math.E;
                    expression = 'e';
                    break;
                case 'factorial':
                    if (!Number.isInteger(value) || value < 0 || value > 170) {
                        this.showError('Domain error: Input must be integer between 0 and 170');
                        return;
                    }
                    result = this.factorial(value);
                    expression = "".concat(value, "!");
                    break;
                case 'reciprocal':
                    if (Math.abs(value) < 1e-15) {
                        this.showError('Math error: Division by zero');
                        return;
                    }
                    result = 1 / value;
                    expression = "1/(".concat(value, ")");
                    break;
                case 'power10':
                    result = Math.pow(10, value);
                    expression = "10^".concat(value);
                    break;
                case 'exp':
                    result = Math.exp(value);
                    expression = "e^".concat(value);
                    break;
                case 'abs':
                    result = Math.abs(value);
                    expression = "|".concat(value, "|");
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
                    expression = "".concat(value, " rad to deg");
                    break;
                case 'radians':
                    result = value * Math.PI / 180;
                    expression = "".concat(value, " deg to rad");
                    break;
                case 'gradians':
                    result = value * 200 / 180;
                    expression = "".concat(value, " deg to grad");
                    break;
                case 'floor':
                    result = Math.floor(value);
                    expression = "floor(".concat(value, ")");
                    break;
                case 'ceil':
                    result = Math.ceil(value);
                    expression = "ceil(".concat(value, ")");
                    break;
                case 'round':
                    result = Math.round(value);
                    expression = "round(".concat(value, ")");
                    break;
                case 'trunc':
                    result = Math.trunc(value);
                    expression = "trunc(".concat(value, ")");
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
                    expression = "log1p(".concat(value, ")");
                    break;
                case 'expm1':
                    result = Math.expm1(value);
                    expression = "expm1(".concat(value, ")");
                    break;
                case 'gamma':
                    if (value <= 0 || value > 170) {
                        this.showError('Domain error: Input must be positive and <= 170');
                        return;
                    }
                    result = this.gammaFunction(value);
                    expression = "\u0393(".concat(value, ")");
                    break;
                case 'erf':
                    result = this.errorFunction(value);
                    expression = "erf(".concat(value, ")");
                    break;
                case 'erfc':
                    result = 1 - this.errorFunction(value);
                    expression = "erfc(".concat(value, ")");
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
                    this.state.expression = this.state.currentValue + ' XOR ';
                    this.state.shouldResetInput = true;
                    this.updateDisplay();
                    return;
                case 'bitwiseNot':
                    var intVal = this.parseCurrentValueAsInt();
                    if (isNaN(intVal)) {
                        this.showError('Invalid input for bitwise operation');
                        return;
                    }
                    result = ~intVal;
                    expression = "~".concat(value);
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
                    this.showError("Function ".concat(func, " not implemented yet"));
                    return;
            }

            if (!isFinite(result)) {
                this.showError('Math error: Result too large or undefined');
                return;
            }

            this.state.currentValue = this.formatNumber(result);
            this.state.expression = expression;
            this.state.shouldResetInput = true;
            this.state.lastInput = 'function';
            this.updateDisplay();
            
        } catch (error) {
            console.error('Scientific function error:', error);
            this.showError('Calculation error');
        }
        
        this.animateButton("[data-function=\"".concat(func, "\"]"));
    };

    ScientificCalculator.prototype.calculate = function () {
        if (this.state.expression === '' || this.state.currentValue === 'Error') {
            return;
        }

        try {
            var expr = this.state.expression + this.state.currentValue;
            
            expr = expr.replace(/×/g, '*')
                      .replace(/\//g, '/')
                      .replace(/mod/g, '%')
                      .replace(/\^/g, '**')
                      .replace(/gcd/g, 'this.gcd')
                      .replace(/lcm/g, 'this.lcm')
                      .replace(/nCr/g, 'this.nCr')
                      .replace(/nPr/g, 'this.nPr')
                      .replace(/hypot/g, 'Math.hypot')
                      .replace(/XOR/g, '^');
            
            var sanitizedExpr = this.sanitizeExpression(expr);
            var result = this.safeEval(sanitizedExpr);
            
            if (!isFinite(result)) {
                this.showError('Math error: Result too large or undefined');
                return;
            }

            this.addToHistory(this.state.expression + this.state.currentValue, result);
            
            this.state.expression += this.state.currentValue + ' = ';
            this.state.currentValue = this.formatNumber(result);
            this.state.shouldResetInput = true;
            this.state.lastInput = 'equals';
            this.updateDisplay();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('Syntax error');
        }
    };

    ScientificCalculator.prototype.sanitizeExpression = function (expr) {
        return expr.replace(/[^0-9+\-*/().\s]/g, '');
    };

    ScientificCalculator.prototype.safeEval = function (expr) {
        try {
            return Function('"use strict"; return (' + expr + ')')();
        } catch (e) {
            throw new Error('Invalid expression');
        }
    };

    ScientificCalculator.prototype.clear = function () {
        this.state.currentValue = '0';
        this.state.expression = '';
        this.state.shouldResetInput = false;
        this.state.lastInput = null;
        this.updateDisplay();
    };

    ScientificCalculator.prototype.clearEntry = function () {
        this.state.currentValue = '0';
        this.state.lastInput = null;
        this.updateDisplay();
    };

    ScientificCalculator.prototype.backspace = function () {
        if (this.state.currentValue === 'Error') {
            this.clear();
            return;
        }
        
        if (this.state.currentValue.length > 1 && this.state.currentValue !== '0') {
            this.state.currentValue = this.state.currentValue.slice(0, -1);
        } else {
            this.state.currentValue = '0';
        }
        this.state.lastInput = 'backspace';
        this.updateDisplay();
    };

    ScientificCalculator.prototype.toggleSign = function () {
        if (this.state.currentValue !== '0' && this.state.currentValue !== 'Error') {
            if (this.state.currentValue.startsWith('-')) {
                this.state.currentValue = this.state.currentValue.slice(1);
            } else {
                this.state.currentValue = '-' + this.state.currentValue;
            }
            this.state.lastInput = 'sign';
            this.updateDisplay();
        }
    };

    ScientificCalculator.prototype.percent = function () {
        var value = this.parseCurrentValue();
        this.state.currentValue = (value / 100).toString();
        this.state.lastInput = 'percent';
        this.updateDisplay();
    };

    ScientificCalculator.prototype.memoryClear = function () {
        this.state.memory = 0;
        this.updateStatusBar();
    };

    ScientificCalculator.prototype.memoryRecall = function () {
        this.state.currentValue = this.state.memory.toString();
        this.updateDisplay();
    };

    ScientificCalculator.prototype.memoryAdd = function () {
        this.state.memory += this.parseCurrentValue();
        this.updateStatusBar();
    };

    ScientificCalculator.prototype.memorySubtract = function () {
        this.state.memory -= this.parseCurrentValue();
        this.updateStatusBar();
    };

    ScientificCalculator.prototype.toggleAngleMode = function () {
        var modes = ['deg', 'rad', 'grad'];
        var currentIndex = modes.indexOf(this.state.angleMode);
        this.state.angleMode = modes[(currentIndex + 1) % modes.length];
        this.updateStatusBar();
    };

    ScientificCalculator.prototype.setNumberBase = function (base) {
        this.state.numberBase = base;
        this.updateStatusBar();
        this.updateDisplayFormat();
        this.convertToBase(base);
    };

    ScientificCalculator.prototype.convertToBase = function (base) {
        var value = this.parseCurrentValueAsInt();
        if (isNaN(value)) {
            this.showError('Invalid input for base conversion');
            return;
        }
        
        var newValue;
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
    };

    ScientificCalculator.prototype.changePrecision = function () {
        this.state.precision = this.state.precision === 10 ? 15 : 10;
        this.updateStatusBar();
    };

    ScientificCalculator.prototype.showHistory = function () {
        this.renderHistory();
        this.historyPanel.classList.remove('hidden');
    };

    ScientificCalculator.prototype.addToHistory = function (expression, result) {
        this.state.history.unshift({
            expression: expression,
            result: this.formatNumber(result),
            timestamp: new Date()
        });
        
        if (this.state.history.length > 50) {
            this.state.history.pop();
        }
        
        this.saveHistory();
    };

    ScientificCalculator.prototype.renderHistory = function () {
        var _this = this;
        this.historyList.innerHTML = '';
        
        this.state.history.forEach(function (item) {
            var historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = "\n                <div class=\"history-expression\">".concat(this.escapeHtml(item.expression), "</div>\n                <div class=\"history-result\">").concat(this.escapeHtml(item.result), "</div>\n            ");
            
            historyItem.addEventListener('click', function () {
                _this.state.currentValue = item.result;
                _this.updateDisplay();
                _this.historyPanel.classList.add('hidden');
            });
            
            this.historyList.appendChild(historyItem);
        }.bind(this));
    };

    ScientificCalculator.prototype.escapeHtml = function (text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    ScientificCalculator.prototype.toggleTheme = function () {
        this.state.currentTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
        this.updateThemeIcon();
    };

    ScientificCalculator.prototype.applyTheme = function () {
        document.documentElement.setAttribute('data-theme', this.state.currentTheme);
    };

    ScientificCalculator.prototype.updateThemeIcon = function () {
        if (!this.themeToggle) return;
        
        var icon = this.themeToggle.querySelector('i');
        if (icon) {
            if (this.state.currentTheme === 'light') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    };

    ScientificCalculator.prototype.loadTheme = function () {
        try {
            var savedTheme = localStorage.getItem('calculatorTheme');
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                this.state.currentTheme = savedTheme;
            }
        } catch (e) {
            console.warn('Failed to load theme from localStorage');
        }
        this.applyTheme();
        this.updateThemeIcon();
    };

    ScientificCalculator.prototype.saveTheme = function () {
        try {
            localStorage.setItem('calculatorTheme', this.state.currentTheme);
        } catch (e) {
            console.warn('Failed to save theme to localStorage');
        }
    };

    ScientificCalculator.prototype.loadHistory = function () {
        try {
            var savedHistory = localStorage.getItem('calculatorHistory');
            if (savedHistory) {
                var history = JSON.parse(savedHistory);
                if (Array.isArray(history)) {
                    this.state.history = history.slice(0, 50);
                }
            }
        } catch (e) {
            console.warn('Failed to load history from localStorage');
        }
    };

    ScientificCalculator.prototype.saveHistory = function () {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.state.history));
        } catch (e) {
            console.warn('Failed to save history to localStorage');
        }
    };

    ScientificCalculator.prototype.switchTab = function (tabName) {
        this.state.currentTab = tabName;
        
        var tabs = document.querySelectorAll('.tab');
        var targetTab = document.querySelector("[data-tab=\"".concat(tabName, "\"]"));
        var targetGrid = document.getElementById(tabName + 'Tab');
        
        if (!targetTab || !targetGrid) {
            console.warn('Tab or grid not found:', tabName);
            return;
        }
        
        tabs.forEach(function (tab) {
            tab.classList.remove('active');
        });
        targetTab.classList.add('active');
        
        document.querySelectorAll('.buttons-grid').forEach(function (grid) {
            grid.classList.add('hidden');
        });
        targetGrid.classList.remove('hidden');
    };

    ScientificCalculator.prototype.parseCurrentValue = function () {
        var value = parseFloat(this.state.currentValue);
        return isNaN(value) ? 0 : value;
    };

    ScientificCalculator.prototype.parseCurrentValueAsInt = function () {
        var value = parseInt(this.state.currentValue, 10);
        return isNaN(value) ? 0 : value;
    };

    ScientificCalculator.prototype.toRadians = function (value) {
        switch (this.state.angleMode) {
            case 'deg':
                return value * Math.PI / 180;
            case 'grad':
                return value * Math.PI / 200;
            case 'rad':
            default:
                return value;
        }
    };

    ScientificCalculator.prototype.fromRadians = function (value) {
        switch (this.state.angleMode) {
            case 'deg':
                return value * 180 / Math.PI;
            case 'grad':
                return value * 200 / Math.PI;
            case 'rad':
            default:
                return value;
        }
    };

    ScientificCalculator.prototype.factorial = function (n) {
        if (n === 0 || n === 1) return 1;
        var result = 1;
        for (var i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    };

    ScientificCalculator.prototype.gammaFunction = function (x) {
        if (x === 1) return 1;
        if (x === 0.5) return Math.sqrt(Math.PI);
        return this.factorial(x - 1);
    };

    ScientificCalculator.prototype.errorFunction = function (x) {
        var t = 1.0 / (1.0 + 0.3275911 * Math.abs(x));
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        
        var result = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
        return x >= 0 ? result : -result;
    };

    ScientificCalculator.prototype.gcd = function (a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            var t = b;
            b = a % b;
            a = t;
        }
        return a;
    };

    ScientificCalculator.prototype.lcm = function (a, b) {
        return Math.abs(a * b) / this.gcd(a, b);
    };

    ScientificCalculator.prototype.nCr = function (n, r) {
        if (r < 0 || r > n) return 0;
        if (r === 0 || r === n) return 1;
        r = Math.min(r, n - r);
        var result = 1;
        for (var i = 1; i <= r; i++) {
            result = result * (n - i + 1) / i;
        }
        return Math.round(result);
    };

    ScientificCalculator.prototype.nPr = function (n, r) {
        if (r < 0 || r > n) return 0;
        var result = 1;
        for (var i = 0; i < r; i++) {
            result *= (n - i);
        }
        return result;
    };

    ScientificCalculator.prototype.formatNumber = function (num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return 'Error';
        }
        
        if (!isFinite(num)) {
            return num > 0 ? 'Infinity' : '-Infinity';
        }
        
        if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(Math.max(1, this.state.precision - 1));
        }
        
        var fixed = num.toFixed(this.state.precision);
        return parseFloat(fixed).toString();
    };

    ScientificCalculator.prototype.showError = function (message) {
        var _this = this;
        this.state.currentValue = 'Error';
        this.state.expression = message;
        this.updateDisplay();
        
        setTimeout(function () {
            if (_this.state.currentValue === 'Error') {
                _this.clear();
            }
        }, 3000);
    };

    ScientificCalculator.prototype.animateButton = function (selector) {
        try {
            var button = document.querySelector(selector);
            if (button) {
                button.classList.add('pressed');
                setTimeout(function () {
                    button.classList.remove('pressed');
                }, 150);
            }
        } catch (e) {
            console.warn('Button animation failed for selector:', selector);
        }
    };

    ScientificCalculator.prototype.updateDisplay = function () {
        if (this.displayElement) {
            this.displayElement.textContent = this.state.currentValue;
        }
        if (this.expressionElement) {
            this.expressionElement.textContent = this.state.expression;
        }
    };

    ScientificCalculator.prototype.updateStatusBar = function () {
        if (this.angleModeElement) {
            this.angleModeElement.textContent = this.state.angleMode.toUpperCase();
        }
        if (this.memoryElement) {
            this.memoryElement.textContent = this.formatNumber(this.state.memory);
        }
        if (this.numberBaseElement) {
            this.numberBaseElement.textContent = this.state.numberBase.toUpperCase();
        }
        if (this.precisionElement) {
            this.precisionElement.textContent = this.state.precision.toString();
        }
    };

    ScientificCalculator.prototype.updateDisplayFormat = function () {
        if (this.displayFormatElement) {
            this.displayFormatElement.textContent = this.state.numberBase.toUpperCase();
        }
    };

    ScientificCalculator.prototype.handleKeyboard = function (event) {
        var key = event.key;
        
        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }

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
            var tabs = ['basic', 'scientific', 'statistics', 'programming'];
            var currentIndex = tabs.indexOf(this.state.currentTab);
            var nextIndex = (currentIndex + 1) % tabs.length;
            this.switchTab(tabs[nextIndex]);
        }
    };

    return ScientificCalculator;
}());

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    try {
        new ScientificCalculator();
    } catch (error) {
        console.error('Failed to initialize calculator:', error);
        alert('Sorry, the calculator failed to load. Please refresh the page.');
    }
});