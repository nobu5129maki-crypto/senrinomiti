package jp.senri.arukou;

import android.content.Context;
import android.content.Intent;

/** StepTrackingService → DailyStepsPlugin へ歩数更新を通知する */
public final class StepUpdateEvents {

    public static final String ACTION_STEPS_UPDATED = "jp.senri.arukou.STEPS_UPDATED";
    public static final String EXTRA_STEPS = "steps";
    public static final String EXTRA_DATE = "date";

    private StepUpdateEvents() {}

    public static void sendStepsUpdated(Context context, int steps, String dateKey) {
        Intent intent = new Intent(ACTION_STEPS_UPDATED);
        intent.setPackage(context.getPackageName());
        intent.putExtra(EXTRA_STEPS, steps);
        intent.putExtra(EXTRA_DATE, dateKey);
        context.sendBroadcast(intent);
    }
}
