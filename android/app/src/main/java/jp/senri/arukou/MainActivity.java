package jp.senri.arukou;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DailyStepsPlugin.class);
        super.onCreate(savedInstanceState);
        if (StepCounterStore.isTrackingEnabled(this)) {
            StepTrackingService.start(this);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (StepCounterStore.isTrackingEnabled(this)) {
            StepTrackingService.start(this);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
