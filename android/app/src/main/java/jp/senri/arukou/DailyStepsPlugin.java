package jp.senri.arukou;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.List;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "DailySteps",
    permissions = {
        @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activityRecognition"),
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class DailyStepsPlugin extends Plugin {

    @Nullable
    private BroadcastReceiver stepsUpdatedReceiver;

    @Override
    public void load() {
        super.load();
        registerStepsUpdatedReceiver();
        if (StepCounterStore.isTrackingEnabled(getContext())) {
            StepTrackingService.start(getContext());
        }
    }

    @Override
    protected void handleOnDestroy() {
        unregisterStepsUpdatedReceiver();
        super.handleOnDestroy();
    }

    private void registerStepsUpdatedReceiver() {
        if (stepsUpdatedReceiver != null) {
            return;
        }
        stepsUpdatedReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) {
                    return;
                }
                if (!StepUpdateEvents.ACTION_STEPS_UPDATED.equals(intent.getAction())) {
                    return;
                }
                int steps = intent.getIntExtra(StepUpdateEvents.EXTRA_STEPS, 0);
                String date = intent.getStringExtra(StepUpdateEvents.EXTRA_DATE);
                if (date == null || date.isEmpty()) {
                    date = StepCounterStore.todayKey();
                }
                JSObject payload = new JSObject();
                payload.put("steps", steps);
                payload.put("date", date);
                notifyListeners("stepsUpdated", payload);
            }
        };

        IntentFilter filter = new IntentFilter(StepUpdateEvents.ACTION_STEPS_UPDATED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(stepsUpdatedReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(stepsUpdatedReceiver, filter);
        }
    }

    private void unregisterStepsUpdatedReceiver() {
        if (stepsUpdatedReceiver == null) {
            return;
        }
        try {
            getContext().unregisterReceiver(stepsUpdatedReceiver);
        } catch (Exception ignored) {
            /* ignore */
        }
        stepsUpdatedReceiver = null;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        call.resolve(result);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("activityRecognition", hasActivityRecognition() ? "granted" : "denied");
        result.put("notifications", hasNotifications() ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasNotifications()) {
            requestPermissionForAlias("notifications", call, "permissionsCallback");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasActivityRecognition()) {
            requestPermissionForAlias("activityRecognition", call, "permissionsCallback");
            return;
        }
        resolvePermissions(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionsCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasActivityRecognition()) {
            requestPermissionForAlias("activityRecognition", call, "permissionsCallback");
            return;
        }
        resolvePermissions(call);
    }

    private void resolvePermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("activityRecognition", hasActivityRecognition() ? "granted" : "denied");
        result.put("notifications", hasNotifications() ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        if (!hasActivityRecognition()) {
            call.reject("Activity recognition permission not granted.");
            return;
        }
        StepCounterStore.setTrackingEnabled(getContext(), true);
        StepTrackingService.start(getContext());
        resolveTracking(call, true);
    }

    @PluginMethod
    public void ensureRunning(PluginCall call) {
        if (!hasActivityRecognition()) {
            call.reject("Activity recognition permission not granted.");
            return;
        }
        StepCounterStore.setTrackingEnabled(getContext(), true);
        StepTrackingService.start(getContext());
        resolveTracking(call, true);
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        StepTrackingService.stop(getContext());
        resolveTracking(call, false);
    }

    @PluginMethod
    public void isTracking(PluginCall call) {
        resolveTracking(call, StepCounterStore.isTrackingEnabled(getContext()));
    }

    @PluginMethod
    public void getTodaySteps(PluginCall call) {
        Context context = getContext();
        if (StepCounterStore.isTrackingEnabled(context)) {
            StepTrackingService.start(context);
        }
        StepCounterStore.checkAndRollDay(context);
        JSObject result = new JSObject();
        result.put("steps", StepCounterStore.getTodaySteps(context));
        result.put("date", StepCounterStore.todayKey());
        result.put("updatedAt", StepCounterStore.getUpdatedAtMs(context));
        result.put("tracking", StepCounterStore.isTrackingEnabled(context));
        call.resolve(result);
    }

    @PluginMethod
    public void getPendingDays(PluginCall call) {
        List<JSONObject> pending = StepCounterStore.getPendingDays(getContext());
        JSArray arr = new JSArray();
        for (JSONObject item : pending) {
            arr.put(item);
        }
        JSObject result = new JSObject();
        result.put("days", arr);
        call.resolve(result);
    }

    @PluginMethod
    public void clearPendingDays(PluginCall call) {
        StepCounterStore.clearPendingDays(getContext());
        call.resolve();
    }

    @PluginMethod
    public void acknowledgePendingDay(PluginCall call) {
        String date = call.getString("date", "");
        if (!date.isEmpty()) {
            StepCounterStore.removePendingDay(getContext(), date);
        }
        call.resolve();
    }

    @PluginMethod
    public void resetToday(PluginCall call) {
        StepCounterStore.resetToday(getContext());
        call.resolve();
    }

    @PluginMethod
    public void isBatteryOptimized(PluginCall call) {
        JSObject result = new JSObject();
        result.put("optimized", isBatteryOptimizationEnabled(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        if (!isBatteryOptimizationEnabled(context)) {
            call.resolve();
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open battery optimization settings.", e);
        }
    }

    private void resolveTracking(PluginCall call, boolean tracking) {
        JSObject result = new JSObject();
        result.put("tracking", tracking);
        call.resolve(result);
    }

    private boolean hasActivityRecognition() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return true;
        }
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasNotifications() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isBatteryOptimizationEnabled(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return false;
        }
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (pm == null) {
            return false;
        }
        return !pm.isIgnoringBatteryOptimizations(context.getPackageName());
    }
}
