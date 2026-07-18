package jp.senri.arukou;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 端末の TYPE_STEP_COUNTER（起動後累計）から日次歩数を永続化する。
 */
public final class StepCounterStore {

    private static final String PREFS = "senri_daily_steps";

    private static final String KEY_TRACKING = "tracking_enabled";
    private static final String KEY_DAY = "day_key";
    private static final String KEY_BASELINE = "day_baseline";
    private static final String KEY_LAST_COUNTER = "last_counter";
    private static final String KEY_TODAY = "today_steps";
    private static final String KEY_PENDING = "pending_days_json";
    private static final String KEY_UPDATED_AT = "updated_at_ms";

    private StepCounterStore() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static String todayKey() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        return sdf.format(new Date());
    }

    public static boolean isTrackingEnabled(Context context) {
        return prefs(context).getBoolean(KEY_TRACKING, false);
    }

    public static void setTrackingEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_TRACKING, enabled).apply();
    }

    public static synchronized void onCounterReading(Context context, float rawCounter) {
        SharedPreferences prefs = prefs(context);
        int counter = Math.max(0, (int) rawCounter);
        String day = todayKey();
        String savedDay = prefs.getString(KEY_DAY, "");
        int baseline = prefs.getInt(KEY_BASELINE, counter);
        int lastCounter = prefs.getInt(KEY_LAST_COUNTER, counter);

        if (counter < lastCounter) {
            baseline = counter;
            savedDay = day;
        }

        if (!day.equals(savedDay)) {
            int previousDaySteps = prefs.getInt(KEY_TODAY, 0);
            if (!savedDay.isEmpty() && previousDaySteps > 0) {
                addPendingDay(context, savedDay, previousDaySteps);
            }
            baseline = counter;
            savedDay = day;
        }

        int todaySteps = Math.max(0, counter - baseline);

        prefs.edit()
            .putString(KEY_DAY, savedDay)
            .putInt(KEY_BASELINE, baseline)
            .putInt(KEY_LAST_COUNTER, counter)
            .putInt(KEY_TODAY, todaySteps)
            .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
            .commit();
    }

    public static int getTodaySteps(Context context) {
        checkAndRollDay(context);
        return Math.max(0, prefs(context).getInt(KEY_TODAY, 0));
    }

    public static long getUpdatedAtMs(Context context) {
        return prefs(context).getLong(KEY_UPDATED_AT, 0L);
    }

    /** 日付が変わったら本日歩数をリセットし、前日分を保留キューへ保存 */
    public static synchronized void checkAndRollDay(Context context) {
        SharedPreferences prefs = prefs(context);
        String day = todayKey();
        String savedDay = prefs.getString(KEY_DAY, "");
        if (savedDay.isEmpty()) {
            prefs.edit().putString(KEY_DAY, day).apply();
            return;
        }
        if (day.equals(savedDay)) {
            return;
        }

        int previousDaySteps = prefs.getInt(KEY_TODAY, 0);
        if (previousDaySteps > 0) {
            addPendingDay(context, savedDay, previousDaySteps);
        }

        int counter = prefs.getInt(KEY_LAST_COUNTER, 0);
        prefs.edit()
            .putString(KEY_DAY, day)
            .putInt(KEY_BASELINE, counter)
            .putInt(KEY_TODAY, 0)
            .apply();
    }

    public static void resetToday(Context context) {
        SharedPreferences prefs = prefs(context);
        int counter = prefs.getInt(KEY_LAST_COUNTER, 0);
        prefs.edit()
            .putString(KEY_DAY, todayKey())
            .putInt(KEY_BASELINE, counter)
            .putInt(KEY_TODAY, 0)
            .apply();
    }

    private static void addPendingDay(Context context, String dayKey, int steps) {
        try {
            SharedPreferences prefs = prefs(context);
            JSONArray arr = new JSONArray(prefs.getString(KEY_PENDING, "[]"));
            boolean updated = false;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.getJSONObject(i);
                if (dayKey.equals(item.optString("date"))) {
                    item.put("steps", Math.max(item.optInt("steps", 0), steps));
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                JSONObject item = new JSONObject();
                item.put("date", dayKey);
                item.put("steps", steps);
                arr.put(item);
            }
            prefs.edit().putString(KEY_PENDING, arr.toString()).apply();
        } catch (Exception ignored) {
            /* ignore */
        }
    }

    public static List<JSONObject> getPendingDays(Context context) {
        List<JSONObject> out = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(prefs(context).getString(KEY_PENDING, "[]"));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.getJSONObject(i);
                if (item.optInt("steps", 0) > 0) {
                    out.add(item);
                }
            }
        } catch (Exception ignored) {
            /* ignore */
        }
        return out;
    }

    public static void clearPendingDays(Context context) {
        prefs(context).edit().putString(KEY_PENDING, "[]").apply();
    }

    public static void removePendingDay(Context context, String dayKey) {
        try {
            SharedPreferences prefs = prefs(context);
            JSONArray arr = new JSONArray(prefs.getString(KEY_PENDING, "[]"));
            JSONArray next = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.getJSONObject(i);
                if (!dayKey.equals(item.optString("date"))) {
                    next.put(item);
                }
            }
            prefs.edit().putString(KEY_PENDING, next.toString()).apply();
        } catch (Exception ignored) {
            /* ignore */
        }
    }
}
