// Budget Tracker Application with Authentication
console.log("[v0] Budget Tracker script loading...")

class AdvancedBudgetTracker {
  constructor() {
    console.log("[v0] AdvancedBudgetTracker constructor called")
    this.currentUser = null
    this.transactions = []
    this.budget = 0
    this.goals = []
    this.chart = null
    this.chartPeriod = 7
    this.selectedCurrency = "USD"
    this.currencies = {
      USD: { symbol: "$", name: "US Dollar", decimals: 2 },
      EUR: { symbol: "€", name: "Euro", decimals: 2 },
      GBP: { symbol: "£", name: "British Pound", decimals: 2 },
      JPY: { symbol: "¥", name: "Japanese Yen", decimals: 0 },
      CAD: { symbol: "C$", name: "Canadian Dollar", decimals: 2 },
      AUD: { symbol: "A$", name: "Australian Dollar", decimals: 2 },
      CHF: { symbol: "Fr", name: "Swiss Franc", decimals: 2 },
      CNY: { symbol: "¥", name: "Chinese Yuan", decimals: 2 },
      INR: { symbol: "₹", name: "Indian Rupee", decimals: 2 },
      KRW: { symbol: "₩", name: "South Korean Won", decimals: 0 },
      BRL: { symbol: "R$", name: "Brazilian Real", decimals: 2 },
      MXN: { symbol: "$", name: "Mexican Peso", decimals: 2 },
    }

    this.debouncedUpdateDisplay = this.debounce(this.updateDisplay.bind(this), 100)
    this.debouncedUpdateChart = this.debounce(this.updateChart.bind(this), 200)

    this.init()
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  init() {
    console.log("[v0] Initializing budget tracker...")
    this.checkAuthStatus()
    this.setupEventListeners()
    this.setDefaultDate()
    this.setupChartPeriodButtons()
    this.createTestUser()
    console.log("[v0] Budget tracker initialization complete")
  }

  createTestUser() {
    const users = JSON.parse(localStorage.getItem("budgetUsers") || "[]")

    // Check if test user already exists
    if (!users.find((user) => user.email === "test@example.com")) {
      const testUser = {
        id: "test_user_123",
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        createdAt: new Date().toISOString(),
      }

      users.push(testUser)
      localStorage.setItem("budgetUsers", JSON.stringify(users))
      console.log("[v0] Test user created: test@example.com / password123")
    }
  }

  // Authentication Methods
  checkAuthStatus() {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
      this.hideAuthOverlay()
      this.loadUserData()
      this.updateUserDisplay()
      this.showWelcomeMessage()
    } else {
      this.showAuthOverlay()
    }
  }

  showAuthOverlay() {
    console.log("[v0] Showing authentication overlay")
    const authOverlay = document.getElementById("authOverlay")
    if (authOverlay) {
      authOverlay.classList.remove("hidden")
      console.log("[v0] Auth overlay shown successfully")
    } else {
      console.error("[v0] Auth overlay element not found!")
    }
  }

  hideAuthOverlay() {
    console.log("[v0] Hiding authentication overlay")
    const authOverlay = document.getElementById("authOverlay")
    if (authOverlay) {
      authOverlay.classList.add("hidden")
      console.log("[v0] Auth overlay hidden successfully")
    } else {
      console.error("[v0] Auth overlay element not found!")
    }
  }

  register(name, email, password) {
    console.log("[v0] Registration attempt:", { name, email })

    // Get existing users
    const users = JSON.parse(localStorage.getItem("budgetUsers") || "[]")
    console.log("[v0] Existing users:", users.length)

    // Check if user already exists
    if (users.find((user) => user.email === email)) {
      console.log("[v0] User already exists with email:", email)
      this.showNotification("User already exists with this email!", "error")
      return false
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In a real app, this would be hashed
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem("budgetUsers", JSON.stringify(users))
    console.log("[v0] New user created:", newUser.email)

    // Auto login after registration
    console.log("[v0] Auto-logging in new user...")
    this.login(email, password)
    return true
  }

  login(email, password) {
    console.log("[v0] Login attempt:", { email })

    const users = JSON.parse(localStorage.getItem("budgetUsers") || "[]")
    console.log(
      "[v0] Available users:",
      users.map((u) => u.email),
    )

    const user = users.find((u) => u.email === email && u.password === password)

    if (user) {
      console.log("[v0] Login successful for:", user.email)
      this.currentUser = user
      localStorage.setItem("currentUser", JSON.stringify(user))

      console.log("[v0] Hiding auth overlay...")
      this.hideAuthOverlay()

      console.log("[v0] Loading user data...")
      this.loadUserData()

      console.log("[v0] Updating user display...")
      this.updateUserDisplay()

      console.log("[v0] Showing welcome message...")
      this.showWelcomeMessage()

      return true
    } else {
      console.log("[v0] Login failed - invalid credentials")
      this.showNotification("Invalid email or password!", "error")
      return false
    }
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
    this.transactions = []
    this.budget = 0
    this.goals = []
    this.selectedCurrency = "USD"
    this.showAuthOverlay()
    this.updateDisplay()
    this.updateChart()
  }

  updateUserDisplay() {
    if (this.currentUser) {
      document.getElementById("userName").textContent = this.currentUser.name
    }
  }

  showWelcomeMessage() {
    setTimeout(() => {
      this.showNotification(`Welcome back, ${this.currentUser.name}! 👋`, "success")
    }, 500)
  }

  // Data Management Methods
  getUserStorageKey(key) {
    return `${this.currentUser.id}_${key}`
  }

  loadUserData() {
    if (!this.currentUser) return

    const savedTransactions = localStorage.getItem(this.getUserStorageKey("transactions"))
    const savedBudget = localStorage.getItem(this.getUserStorageKey("budget"))
    const savedGoals = localStorage.getItem(this.getUserStorageKey("goals"))
    const savedCurrency = localStorage.getItem(this.getUserStorageKey("currency"))

    this.transactions = savedTransactions ? JSON.parse(savedTransactions) : []
    this.budget = savedBudget ? Number.parseFloat(savedBudget) : 0
    this.goals = savedGoals ? JSON.parse(savedGoals) : []
    this.selectedCurrency = savedCurrency || "USD"

    this.updateCurrencyDisplay()

    // Use debounced updates for better performance
    this.debouncedUpdateDisplay()
    this.debouncedUpdateChart()
  }

  saveUserData() {
    if (!this.currentUser) return

    localStorage.setItem(this.getUserStorageKey("transactions"), JSON.stringify(this.transactions))
    localStorage.setItem(this.getUserStorageKey("budget"), this.budget.toString())
    localStorage.setItem(this.getUserStorageKey("goals"), JSON.stringify(this.goals))
    localStorage.setItem(this.getUserStorageKey("currency"), this.selectedCurrency)
  }

  // Event Listeners
  setupEventListeners() {
    console.log("[v0] Setting up event listeners...")

    const loginForm = document.getElementById("loginFormElement")
    const registerForm = document.getElementById("registerFormElement")

    console.log("[v0] Login form element:", loginForm)
    console.log("[v0] Register form element:", registerForm)

    if (!loginForm) {
      console.error("[v0] Login form not found!")
      return
    }

    if (!registerForm) {
      console.error("[v0] Register form not found!")
      return
    }

    // Auth form listeners
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      console.log("[v0] Login form submitted")
      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value
      console.log("[v0] Login form data:", { email, passwordLength: password.length })

      if (!email || !password) {
        console.log("[v0] Missing email or password")
        this.showNotification("Please enter both email and password!", "error")
        return
      }

      this.login(email, password)
    })

    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      console.log("[v0] Register form submitted")
      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("confirmPassword").value

      console.log("[v0] Register form data:", {
        name,
        email,
        passwordLength: password.length,
        confirmPasswordLength: confirmPassword.length,
      })

      if (!name || !email || !password || !confirmPassword) {
        console.log("[v0] Missing required fields")
        this.showNotification("Please fill in all fields!", "error")
        return
      }

      if (password !== confirmPassword) {
        console.log("[v0] Password mismatch")
        this.showNotification("Passwords do not match!", "error")
        return
      }

      if (password.length < 6) {
        console.log("[v0] Password too short")
        this.showNotification("Password must be at least 6 characters long!", "error")
        return
      }

      this.register(name, email, password)
    })

    const showRegisterBtn = document.getElementById("showRegister")
    const showLoginBtn = document.getElementById("showLogin")
    const logoutBtn = document.getElementById("logoutBtn")

    console.log("[v0] Show register button:", showRegisterBtn)
    console.log("[v0] Show login button:", showLoginBtn)
    console.log("[v0] Logout button:", logoutBtn)

    if (showRegisterBtn) {
      showRegisterBtn.addEventListener("click", () => {
        console.log("[v0] Switching to register form")
        document.getElementById("loginForm").classList.add("hidden")
        document.getElementById("registerForm").classList.remove("hidden")
      })
    }

    if (showLoginBtn) {
      showLoginBtn.addEventListener("click", () => {
        console.log("[v0] Switching to login form")
        document.getElementById("registerForm").classList.add("hidden")
        document.getElementById("loginForm").classList.remove("hidden")
      })
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        console.log("[v0] Logout button clicked")
        this.logout()
      })
    }

    // Transaction form
    document.getElementById("transactionForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addTransaction()
    })

    // Budget form
    document.getElementById("budgetForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.setBudget()
    })

    document.getElementById("addGoalBtn").addEventListener("click", () => {
      this.showGoalModal()
    })

    document.getElementById("goalForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.addGoal()
    })

    document.getElementById("cancelGoal").addEventListener("click", () => {
      this.hideGoalModal()
    })

    // Export and clear buttons
    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportToCSV()
    })

    document.getElementById("clearBtn").addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        this.clearAllData()
      }
    })

    document.getElementById("currencySelector").addEventListener("change", (e) => {
      this.changeCurrency(e.target.value)
    })
  }

  setupChartPeriodButtons() {
    document.getElementById("chartPeriod7").addEventListener("click", () => {
      this.setChartPeriod(7)
    })
    document.getElementById("chartPeriod30").addEventListener("click", () => {
      this.setChartPeriod(30)
    })
    document.getElementById("chartPeriod90").addEventListener("click", () => {
      this.setChartPeriod(90)
    })
  }

  setChartPeriod(days) {
    this.chartPeriod = days

    // Update button states
    document.querySelectorAll('[id^="chartPeriod"]').forEach((btn) => {
      btn.className = "px-3 py-1 text-sm font-medium text-neutral-600 hover:text-primary rounded-lg"
    })
    document.getElementById(`chartPeriod${days}`).className =
      "px-3 py-1 text-sm font-medium text-primary bg-blue-50 rounded-lg"

    this.debouncedUpdateChart()
  }

  // Transaction Methods
  addTransaction() {
    if (!this.currentUser) return

    const type = document.getElementById("type").value
    const amount = Number.parseFloat(document.getElementById("amount").value)
    const category = document.getElementById("category").value
    const description = document.getElementById("description").value
    const date = document.getElementById("date").value

    if (!amount || amount <= 0) {
      this.showNotification("Please enter a valid amount!", "error")
      return
    }

    const transaction = {
      id: Date.now().toString(),
      type,
      amount,
      category,
      description,
      date,
      timestamp: new Date().toISOString(),
      currency: this.selectedCurrency,
    }

    this.transactions.unshift(transaction)
    this.saveUserData()
    this.debouncedUpdateDisplay()
    this.debouncedUpdateChart()

    // Reset form
    document.getElementById("transactionForm").reset()
    this.setDefaultDate()

    this.showNotification(`${type === "income" ? "Income" : "Expense"} added successfully!`, "success")
  }

  setBudget() {
    if (!this.currentUser) return

    const budgetAmount = Number.parseFloat(document.getElementById("budgetAmount").value)

    if (!budgetAmount || budgetAmount <= 0) {
      this.showNotification("Please enter a valid budget amount!", "error")
      return
    }

    this.budget = budgetAmount
    this.saveUserData()
    this.debouncedUpdateDisplay()

    document.getElementById("budgetForm").reset()
    this.showNotification("Budget updated successfully!", "success")
  }

  // Display Methods
  updateDisplay() {
    this.updateSummaryCards()
    this.updateBudgetProgress()
    this.updateTransactionsList()
    this.updateCategoryBreakdown()
    this.updateFinancialGoals()
  }

  updateSummaryCards() {
    const totalIncome = this.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = this.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const netBalance = totalIncome - totalExpenses
    const budgetUsed = this.budget > 0 ? (totalExpenses / this.budget) * 100 : 0

    this.animateValue("totalIncome", totalIncome, "currency")
    this.animateValue("totalExpenses", totalExpenses, "currency")
    this.animateValue("netBalance", netBalance, "currency")
    this.animateValue("budgetUsed", budgetUsed, "%")

    // Update status indicators
    const balanceStatus = document.getElementById("balanceStatus")
    const budgetStatus = document.getElementById("budgetStatus")

    if (netBalance >= 0) {
      balanceStatus.textContent = "Healthy Balance"
      balanceStatus.className = "text-xs text-green-500 font-medium mt-1"
    } else {
      balanceStatus.textContent = "Needs Attention"
      balanceStatus.className = "text-xs text-red-500 font-medium mt-1"
    }

    if (budgetUsed <= 75) {
      budgetStatus.textContent = "On Track"
      budgetStatus.className = "text-xs text-green-500 font-medium mt-1"
    } else if (budgetUsed <= 90) {
      budgetStatus.textContent = "Watch Spending"
      budgetStatus.className = "text-xs text-yellow-500 font-medium mt-1"
    } else {
      budgetStatus.textContent = "Over Budget"
      budgetStatus.className = "text-xs text-red-500 font-medium mt-1"
    }

    // Update net balance color
    const netBalanceEl = document.getElementById("netBalance")
    netBalanceEl.className =
      netBalance >= 0
        ? "text-3xl font-heading font-black text-green-600 mt-1"
        : "text-3xl font-heading font-black text-red-600 mt-1"
  }

  animateValue(elementId, finalValue, prefix = "") {
    const element = document.getElementById(elementId)
    const startValue = 0
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const currentValue = startValue + (finalValue - startValue) * this.easeOutCubic(progress)

      if (prefix === "currency") {
        element.textContent = this.formatCurrency(currentValue)
      } else if (prefix === "%") {
        element.textContent = `${currentValue.toFixed(1)}%`
      } else {
        element.textContent = currentValue.toFixed(2)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  updateChart() {
    const ctx = document.getElementById("trendChart").getContext("2d")

    // Get data for the selected period
    const days = []
    const today = new Date()

    for (let i = this.chartPeriod - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split("T")[0])
    }

    const incomeData = days.map((date) => {
      return this.transactions
        .filter((t) => t.type === "income" && t.date === date)
        .reduce((sum, t) => sum + t.amount, 0)
    })

    const expenseData = days.map((date) => {
      return this.transactions
        .filter((t) => t.type === "expense" && t.date === date)
        .reduce((sum, t) => sum + t.amount, 0)
    })

    const labels = days.map((date) => {
      const d = new Date(date)
      if (this.chartPeriod <= 7) {
        return d.toLocaleDateString("en-US", { weekday: "short" })
      } else if (this.chartPeriod <= 30) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      } else {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    })

    // Destroy existing chart to prevent memory leaks
    if (this.chart) {
      this.chart.destroy()
    }

    this.chart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Expenses",
            data: expenseData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: "Open Sans",
                size: 12,
                weight: "500",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#0891b2",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "Open Sans",
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              callback: (value) => this.formatCurrency(value),
              font: {
                family: "Open Sans",
                size: 11,
              },
            },
          },
        },
        elements: {
          line: {
            borderWidth: 3,
          },
        },
        animation: {
          duration: 1000,
          easing: "easeOutCubic",
        },
      },
    })
  }

  updateTransactionsList() {
    const container = document.getElementById("transactionsList")

    if (this.transactions.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500 text-center py-4">No transactions yet. Add your first transaction above!</p>'
      return
    }

    const recentTransactions = this.transactions.slice(0, 10)

    container.innerHTML = recentTransactions
      .map((transaction) => {
        const isIncome = transaction.type === "income"
        const icon = isIncome ? "+" : "-"
        const colorClass = isIncome ? "text-green-600" : "text-red-600"
        const bgClass = isIncome ? "bg-green-50" : "bg-red-50"

        return `
                <div class="transaction-item ${transaction.type} flex items-center justify-between p-3 rounded-lg ${bgClass}">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${isIncome ? "bg-green-100" : "bg-red-100"} flex items-center justify-center">
                            <span class="${colorClass} font-bold">${icon}</span>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${transaction.description || transaction.category}</p>
                            <p class="text-sm text-gray-500">${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <!-- Updated transaction amount to use currency formatting -->
                    <span class="${colorClass} font-bold">${this.formatCurrency(transaction.amount)}</span>
                </div>
            `
      })
      .join("")
  }

  updateCategoryBreakdown() {
    const container = document.getElementById("categoryBreakdown")

    const expensesByCategory = {}
    const totalExpenses = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount
        return sum + t.amount
      }, 0)

    if (totalExpenses === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">No expenses to show categories.</p>'
      return
    }

    const categoryIcons = {
      food: "🍽️",
      transport: "🚗",
      shopping: "🛍️",
      entertainment: "🎬",
      bills: "📄",
      healthcare: "🏥",
      other: "📦",
    }

    container.innerHTML = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100
        return `
                    <div class="category-item flex items-center justify-between p-3 rounded-lg border">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${categoryIcons[category] || "📦"}</span>
                            <div>
                                <p class="font-medium text-gray-900 capitalize">${category.replace(/([A-Z])/g, " $1")}</p>
                                <p class="text-sm text-gray-500">${percentage.toFixed(1)}% of expenses</p>
                            </div>
                        </div>
                        <!-- Updated category amount to use currency formatting -->
                        <span class="font-bold text-gray-900">${this.formatCurrency(amount)}</span>
                    </div>
                `
      })
      .join("")
  }

  updateBudgetProgress() {
    const budgetProgress = document.getElementById("budgetProgress")

    if (this.budget > 0) {
      budgetProgress.classList.remove("hidden")

      const totalExpenses = this.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      const percentage = Math.min((totalExpenses / this.budget) * 100, 100)
      const remaining = Math.max(this.budget - totalExpenses, 0)

      document.getElementById("budgetPercentage").textContent = `${percentage.toFixed(1)}%`
      document.getElementById("budgetBar").style.width = `${percentage}%`
      document.getElementById("budgetSpent").textContent = `${this.formatCurrency(totalExpenses)} spent`
      document.getElementById("budgetRemaining").textContent = `${this.formatCurrency(remaining)} remaining`

      // Change color based on percentage
      const budgetBar = document.getElementById("budgetBar")
      if (percentage >= 90) {
        budgetBar.className = "bg-red-600 h-2 rounded-full transition-all duration-300"
      } else if (percentage >= 75) {
        budgetBar.className = "bg-yellow-600 h-2 rounded-full transition-all duration-300"
      } else {
        budgetBar.className = "bg-blue-600 h-2 rounded-full transition-all duration-300"
      }
    } else {
      budgetProgress.classList.add("hidden")
    }
  }

  showGoalModal() {
    document.getElementById("goalModal").classList.remove("hidden")
  }

  hideGoalModal() {
    document.getElementById("goalModal").classList.add("hidden")
    document.getElementById("goalForm").reset()
  }

  addGoal() {
    if (!this.currentUser) return

    const name = document.getElementById("goalName").value
    const amount = Number.parseFloat(document.getElementById("goalAmount").value)
    const date = document.getElementById("goalDate").value

    if (!name || !amount || amount <= 0 || !date) {
      this.showNotification("Please fill in all goal details!", "error")
      return
    }

    const goal = {
      id: Date.now().toString(),
      name,
      targetAmount: amount,
      currentAmount: 0,
      targetDate: date,
      createdAt: new Date().toISOString(),
      currency: this.selectedCurrency,
    }

    this.goals.push(goal)
    this.saveUserData()
    this.updateFinancialGoals()
    this.hideGoalModal()

    this.showNotification(`Goal "${name}" added successfully! 🎯`, "success")
  }

  updateFinancialGoals() {
    const container = document.getElementById("financialGoals")

    if (this.goals.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <div class="w-16 h-16 bg-gradient-to-br from-accent to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <p class="text-neutral-600 font-medium">No financial goals yet</p>
          <p class="text-sm text-neutral-500 mt-1">Set your first goal to start tracking your progress</p>
        </div>
      `
      return
    }

    container.innerHTML = this.goals
      .map((goal) => {
        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))

        return `
          <div class="goal-card p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-heading font-bold text-gray-900">${goal.name}</h3>
              <button onclick="budgetTracker.removeGoal('${goal.id}')" class="text-red-500 hover:text-red-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            <div class="mb-4">
              <div class="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <!-- Updated goal progress to use currency formatting -->
                <span>${this.formatCurrency(goal.currentAmount)} / ${this.formatCurrency(goal.targetAmount)}</span>
                <span>${progress.toFixed(1)}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div class="goal-progress h-3 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
              </div>
            </div>
            <div class="flex justify-between text-xs text-neutral-600">
              <span>${daysLeft > 0 ? `${daysLeft} days left` : "Goal date passed"}</span>
              <span>${new Date(goal.targetDate).toLocaleDateString()}</span>
            </div>
          </div>
        `
      })
      .join("")
  }

  removeGoal(goalId) {
    if (confirm("Are you sure you want to remove this goal?")) {
      this.goals = this.goals.filter((goal) => goal.id !== goalId)
      this.saveUserData()
      this.updateFinancialGoals()
      this.showNotification("Goal removed successfully!", "success")
    }
  }

  // Utility Methods
  exportToCSV() {
    if (!this.currentUser || this.transactions.length === 0) {
      this.showNotification("No data to export!", "error")
      return
    }

    const headers = ["Date", "Type", "Category", "Description", "Amount", "Currency"]
    const csvContent = [
      headers.join(","),
      ...this.transactions.map((t) =>
        [t.date, t.type, t.category, `"${t.description || ""}"`, t.amount, t.currency].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `budget-tracker-${this.currentUser.name}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    this.showNotification("Data exported successfully!", "success")
  }

  clearAllData() {
    if (!this.currentUser) return

    this.transactions = []
    this.budget = 0
    this.goals = []
    this.saveUserData()
    this.debouncedUpdateDisplay()
    this.debouncedUpdateChart()

    this.showNotification("All data cleared!", "success")
  }

  showNotification(message, type = "success") {
    console.log("[v0] Showing notification:", { message, type })
    const notification = document.getElementById("notification")
    const notificationText = document.getElementById("notificationText")

    notificationText.textContent = message

    // Set styling based on type
    if (type === "error") {
      notification.className =
        "fixed top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl transform translate-x-full transition-all duration-300 z-50 border border-red-400"
    } else if (type === "warning") {
      notification.className =
        "fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-2xl shadow-2xl transform translate-x-full transition-all duration-300 z-50 border border-yellow-400"
    } else {
      notification.className =
        "fixed top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl transform translate-x-full transition-all duration-300 z-50 border border-green-400"
    }

    // Show notification with enhanced animation
    setTimeout(() => {
      notification.classList.add("notification-show")
    }, 100)

    // Hide notification after 4 seconds
    setTimeout(() => {
      notification.classList.remove("notification-show")
    }, 4000)
  }

  setDefaultDate() {
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("date").value = today
  }

  changeCurrency(newCurrency) {
    this.selectedCurrency = newCurrency
    this.saveUserData()
    this.updateCurrencyDisplay()
    this.debouncedUpdateDisplay()
    this.debouncedUpdateChart()
    this.showNotification(`Currency changed to ${this.currencies[newCurrency].name}`, "success")
  }

  updateCurrencyDisplay() {
    const currencySelector = document.getElementById("currencySelector")
    const amountSymbol = document.getElementById("amountCurrencySymbol")
    const budgetSymbol = document.getElementById("budgetCurrencySymbol")
    const goalSymbol = document.getElementById("goalCurrencySymbol")

    if (currencySelector) currencySelector.value = this.selectedCurrency
    if (amountSymbol) amountSymbol.textContent = this.currencies[this.selectedCurrency].symbol
    if (budgetSymbol) budgetSymbol.textContent = this.currencies[this.selectedCurrency].symbol
    if (goalSymbol) goalSymbol.textContent = this.currencies[this.selectedCurrency].symbol
  }

  formatCurrency(amount) {
    const currency = this.currencies[this.selectedCurrency]
    return `${currency.symbol}${amount.toFixed(currency.decimals)}`
  }
}

console.log("[v0] Setting up DOMContentLoaded listener...")

// Initialize the application
let budgetTracker
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM Content Loaded - initializing budget tracker")
  try {
    budgetTracker = new AdvancedBudgetTracker()
    console.log("[v0] Budget tracker initialized successfully")
  } catch (error) {
    console.error("[v0] Error initializing budget tracker:", error)
  }
})

console.log("[v0] Budget Tracker script loaded successfully")
