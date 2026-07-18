package jp.senri.arukou;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class StepTrackingService extends Service implements SensorEventListener {

    private static final String TAG = "StepTrackingService";

    public static final String ACTION_START = "jp.senri.arukou.action.START_STEP_TRACKING";
    public static final String ACTION_STOP = "jp.senri.arukou.action.STOP_STEP_TRACKING";

    private static final int NOTIFICATION_ID = 2001;
    private static final String CHANNEL_ID = "senri-daily-steps";

    @Nullable
    private SensorManager sensorManager;

    @Nullable
    private Sensor stepCounter;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean sensorRegistered = false;

    private static final long KEEP_ALIVE_MS = 10000L;
    private static final long SENSOR_STALE_MS = 45000L;

    private long lastSensorEventAt = 0L;

    private final Runnable keepAliveRunnable = new Runnable() {
        @Override
        public void run() {
            if (!StepCounterStore.isTrackingEnabled(StepTrackingService.this)) {
                return;
            }
            StepCounterStore.checkAndRollDay(StepTrackingService.this);
            updateNotification(StepCounterStore.getTodaySteps(StepTrackingService.this));
            refreshSensorRegistration(false);
            mainHandler.postDelayed(this, KEEP_ALIVE_MS);
        }
    };

    public static void start(Context context) {
        Context appContext = context.getApplicationContext();
        Intent intent = new Intent(appContext, StepTrackingService.class);
        intent.setAction(ACTION_START);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                appContext.startForegroundService(intent);
            } else {
                appContext.startService(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service", e);
        }
    }

    public static void stop(Context context) {
        Context appContext = context.getApplicationContext();
        Intent intent = new Intent(appContext, StepTrackingService.class);
        intent.setAction(ACTION_STOP);
        appContext.startService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        if (ACTION_STOP.equals(action)) {
            stopTrackingInternal();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        StepCounterStore.setTrackingEnabled(this, true);
        StepCounterStore.checkAndRollDay(this);
        startTrackingInternal();
        return START_STICKY;
    }

    private void startTrackingInternal() {
        Notification notification = buildNotification(StepCounterStore.getTodaySteps(this));
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "startForeground failed, retrying without type", e);
            try {
                startForeground(NOTIFICATION_ID, notification);
            } catch (Exception inner) {
                Log.e(TAG, "startForeground retry failed", inner);
                stopSelf();
                return;
            }
        }

        refreshSensorRegistration(true);
        mainHandler.removeCallbacks(keepAliveRunnable);
        mainHandler.postDelayed(keepAliveRunnable, KEEP_ALIVE_MS);
    }

    private void refreshSensorRegistration(boolean force) {
        if (sensorManager == null || stepCounter == null) {
            return;
        }

        long now = System.currentTimeMillis();
        long lastUpdate = Math.max(lastSensorEventAt, StepCounterStore.getUpdatedAtMs(this));
        boolean stale = lastSensorEventAt > 0 && now - lastSensorEventAt > SENSOR_STALE_MS;
        boolean neverUpdated = lastSensorEventAt == 0 && lastUpdate > 0 && now - lastUpdate > SENSOR_STALE_MS;

        if (!force && sensorRegistered && !stale && !neverUpdated) {
            return;
        }

        if (sensorRegistered) {
            try {
                sensorManager.unregisterListener(this);
            } catch (Exception e) {
                Log.w(TAG, "Sensor unregister failed", e);
            }
            sensorRegistered = false;
        }

        try {
            boolean ok = sensorManager.registerListener(
                this,
                stepCounter,
                SensorManager.SENSOR_DELAY_NORMAL
            );
            sensorRegistered = ok;
            if (!ok) {
                Log.w(TAG, "Failed to register step counter sensor");
            }
        } catch (Exception e) {
            Log.e(TAG, "Sensor registration error", e);
            sensorRegistered = false;
        }
    }

    private void stopTrackingInternal() {
        StepCounterStore.setTrackingEnabled(this, false);
        mainHandler.removeCallbacks(keepAliveRunnable);
        if (sensorManager != null && sensorRegistered) {
            sensorManager.unregisterListener(this);
            sensorRegistered = false;
        }
    }

    @Override
    public void onDestroy() {
        boolean shouldRestart = StepCounterStore.isTrackingEnabled(this);
        mainHandler.removeCallbacks(keepAliveRunnable);
        if (sensorManager != null && sensorRegistered) {
            sensorManager.unregisterListener(this);
            sensorRegistered = false;
        }
        if (shouldRestart) {
            StepTrackingService.start(getApplicationContext());
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        if (StepCounterStore.isTrackingEnabled(this)) {
            StepTrackingService.start(getApplicationContext());
        }
        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) {
            return;
        }
        lastSensorEventAt = System.currentTimeMillis();
        StepCounterStore.onCounterReading(this, event.values[0]);
        int todaySteps = StepCounterStore.getTodaySteps(this);
        updateNotification(todaySteps);
        StepUpdateEvents.sendStepsUpdated(this, todaySteps, StepCounterStore.todayKey());
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        /* no-op */
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "万歩計",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("バックグラウンドで毎日の歩数を記録しています");
        channel.setShowBadge(true);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(int todaySteps) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String body = String.format(
            java.util.Locale.getDefault(),
            "本日 %,d 歩 — 千里の道も一歩から",
            todaySteps
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("万歩計 計測中")
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_stat_walk)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void updateNotification(int todaySteps) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            Notification notification = buildNotification(todaySteps);
            manager.notify(NOTIFICATION_ID, notification);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        startForeground(
                            NOTIFICATION_ID,
                            notification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
                        );
                    } else {
                        startForeground(NOTIFICATION_ID, notification);
                    }
                } catch (Exception ignored) {
                    /* ignore */
                }
            }
        }
    }
}
