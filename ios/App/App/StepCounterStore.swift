import Foundation

enum StepCounterStore {
    private static let prefs = UserDefaults.standard
    private static let keyTracking = "senri_daily_steps.tracking_enabled"
    private static let keyDay = "senri_daily_steps.day_key"
    private static let keyToday = "senri_daily_steps.today_steps"
    private static let keyPending = "senri_daily_steps.pending_days_json"

    static func todayKey(from date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    static func startOfToday(from date: Date = Date()) -> Date {
        Calendar.current.startOfDay(for: date)
    }

    static func isTrackingEnabled() -> Bool {
        prefs.bool(forKey: keyTracking)
    }

    static func setTrackingEnabled(_ enabled: Bool) {
        prefs.set(enabled, forKey: keyTracking)
    }

    static func getTodaySteps() -> Int {
        rollDayIfNeeded()
        return max(0, prefs.integer(forKey: keyToday))
    }

    static func saveTodaySteps(_ steps: Int, date: Date = Date()) {
        let day = todayKey(from: date)
        let savedDay = prefs.string(forKey: keyDay) ?? ""

        if savedDay != day {
            let previousSteps = max(0, prefs.integer(forKey: keyToday))
            if !savedDay.isEmpty && previousSteps > 0 {
                addPendingDay(dateKey: savedDay, steps: previousSteps)
            }
            prefs.set(day, forKey: keyDay)
        }

        prefs.set(max(0, steps), forKey: keyToday)
    }

    static func resetToday() {
        prefs.set(todayKey(), forKey: keyDay)
        prefs.set(0, forKey: keyToday)
    }

    static func rollDayIfNeeded() {
        let day = todayKey()
        let savedDay = prefs.string(forKey: keyDay) ?? ""
        if savedDay.isEmpty {
            prefs.set(day, forKey: keyDay)
            return
        }
        if savedDay != day {
            let previousSteps = max(0, prefs.integer(forKey: keyToday))
            if previousSteps > 0 {
                addPendingDay(dateKey: savedDay, steps: previousSteps)
            }
            prefs.set(day, forKey: keyDay)
            prefs.set(0, forKey: keyToday)
        }
    }

    static func getPendingDays() -> [[String: Any]] {
        guard
            let raw = prefs.string(forKey: keyPending),
            let data = raw.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else {
            return []
        }
        return json.filter { ($0["steps"] as? Int ?? 0) > 0 }
    }

    static func clearPendingDays() {
        prefs.set("[]", forKey: keyPending)
    }

    static func removePendingDay(_ dateKey: String) {
        var items = getPendingDays()
        items.removeAll { ($0["date"] as? String) == dateKey }
        savePendingDays(items)
    }

    private static func addPendingDay(dateKey: String, steps: Int) {
        var items = getPendingDays()
        if let index = items.firstIndex(where: { ($0["date"] as? String) == dateKey }) {
            let current = items[index]["steps"] as? Int ?? 0
            items[index]["steps"] = max(current, steps)
        } else {
            items.append(["date": dateKey, "steps": steps])
        }
        savePendingDays(items)
    }

    private static func savePendingDays(_ items: [[String: Any]]) {
        guard let data = try? JSONSerialization.data(withJSONObject: items),
              let raw = String(data: data, encoding: .utf8) else {
            return
        }
        prefs.set(raw, forKey: keyPending)
    }
}
