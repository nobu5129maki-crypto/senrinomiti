import Capacitor
import CoreMotion
import Foundation
import UIKit

@objc(DailyStepsPlugin)
public class DailyStepsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DailyStepsPlugin"
    public let jsName = "DailySteps"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ensureRunning", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTodaySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingDays", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearPendingDays", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acknowledgePendingDay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resetToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isBatteryOptimized", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestIgnoreBatteryOptimizations", returnType: CAPPluginReturnPromise)
    ]

    private let pedometer = CMPedometer()
    private var updatesActive = false
    private var observersRegistered = false

    public override func load() {
        super.load()
        registerLifecycleObservers()
        if StepCounterStore.isTrackingEnabled() {
            startUpdatesInternal()
            refreshTodayStepsInternal()
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": CMPedometer.isStepCountingAvailable()])
    }

    @objc func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(permissionPayload())
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve(["activityRecognition": "denied", "notifications": "granted"])
            return
        }

        let start = Date(timeIntervalSinceNow: -60)
        pedometer.queryPedometerData(from: start, to: Date()) { _, _ in
            call.resolve(self.permissionPayload())
        }
    }

    @objc func startTracking(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.reject("Pedometer not available")
            return
        }
        StepCounterStore.setTrackingEnabled(true)
        startUpdatesInternal()
        refreshTodayStepsInternal { _ in
            call.resolve(["tracking": true])
        }
    }

    @objc func ensureRunning(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.reject("Pedometer not available")
            return
        }
        StepCounterStore.setTrackingEnabled(true)
        startUpdatesInternal()
        refreshTodayStepsInternal { _ in
            call.resolve(["tracking": true])
        }
    }

    @objc func stopTracking(_ call: CAPPluginCall) {
        StepCounterStore.setTrackingEnabled(false)
        stopUpdatesInternal()
        call.resolve(["tracking": false])
    }

    @objc func isTracking(_ call: CAPPluginCall) {
        call.resolve(["tracking": StepCounterStore.isTrackingEnabled()])
    }

    @objc func getTodaySteps(_ call: CAPPluginCall) {
        refreshTodayStepsInternal { steps in
            call.resolve([
                "steps": steps,
                "date": StepCounterStore.todayKey(),
                "updatedAt": Int(Date().timeIntervalSince1970 * 1000),
                "tracking": StepCounterStore.isTrackingEnabled()
            ])
        }
    }

    @objc func getPendingDays(_ call: CAPPluginCall) {
        call.resolve(["days": StepCounterStore.getPendingDays()])
    }

    @objc func clearPendingDays(_ call: CAPPluginCall) {
        StepCounterStore.clearPendingDays()
        call.resolve()
    }

    @objc func acknowledgePendingDay(_ call: CAPPluginCall) {
        if let date = call.getString("date"), !date.isEmpty {
            StepCounterStore.removePendingDay(date)
        }
        call.resolve()
    }

    @objc func resetToday(_ call: CAPPluginCall) {
        StepCounterStore.resetToday()
        call.resolve()
    }

    @objc func isBatteryOptimized(_ call: CAPPluginCall) {
        call.resolve(["optimized": false])
    }

    @objc func requestIgnoreBatteryOptimizations(_ call: CAPPluginCall) {
        call.resolve()
    }

    private func registerLifecycleObservers() {
        guard !observersRegistered else { return }
        observersRegistered = true
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func handleDidBecomeActive() {
        guard StepCounterStore.isTrackingEnabled() else { return }
        startUpdatesInternal()
        refreshTodayStepsInternal()
    }

    private func startUpdatesInternal() {
        guard CMPedometer.isStepCountingAvailable(), !updatesActive else { return }
        let startDate = StepCounterStore.startOfToday()
        pedometer.startUpdates(from: startDate) { [weak self] data, error in
            guard error == nil, let data = data else { return }
            StepCounterStore.saveTodaySteps(data.numberOfSteps.intValue)
            DispatchQueue.main.async {
                self?.notifyListeners("stepsUpdated", data: [
                    "steps": data.numberOfSteps.intValue,
                    "date": StepCounterStore.todayKey()
                ])
            }
        }
        updatesActive = true
    }

    private func stopUpdatesInternal() {
        guard updatesActive else { return }
        pedometer.stopUpdates()
        updatesActive = false
    }

    private func refreshTodayStepsInternal(completion: ((Int) -> Void)? = nil) {
        guard CMPedometer.isStepCountingAvailable() else {
            completion?(StepCounterStore.getTodaySteps())
            return
        }
        let start = StepCounterStore.startOfToday()
        let end = Date()
        pedometer.queryPedometerData(from: start, to: end) { data, error in
            if error == nil, let data = data {
                StepCounterStore.saveTodaySteps(data.numberOfSteps.intValue)
            }
            completion?(StepCounterStore.getTodaySteps())
        }
    }

    private func permissionPayload() -> [String: String] {
        [
            "activityRecognition": currentPermissionState(),
            "notifications": "granted"
        ]
    }

    private func currentPermissionState() -> String {
        guard CMPedometer.isStepCountingAvailable() else {
            return "denied"
        }
        if #available(iOS 11.0, *) {
            switch CMMotionActivityManager.authorizationStatus() {
            case .authorized:
                return "granted"
            case .denied, .restricted:
                return "denied"
            case .notDetermined:
                return "prompt"
            @unknown default:
                return "prompt"
            }
        }
        return "granted"
    }
}
