package jp.senri.arukou;

import android.app.Application;

public class SenriApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        if (StepCounterStore.isTrackingEnabled(this)) {
            StepTrackingService.start(this);
        }
    }
}
