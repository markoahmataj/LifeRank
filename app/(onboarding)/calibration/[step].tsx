// app/(onboarding)/calibration/[step].tsx
// Dynamic step route for the 5-step baseline calibration.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalibrationScreen } from '@/src/screens/CalibrationScreen';
import type { CalibrationAnswer } from '@/src/design-system/types';

export default function CalibrationStepRoute() {
  const { step, answers: answersParam } = useLocalSearchParams<{
    step: string;
    answers?: string;
  }>();
  const router = useRouter();

  const stepIndex = parseInt(step ?? '0', 10);
  const collected: CalibrationAnswer[] = answersParam
    ? (JSON.parse(answersParam) as CalibrationAnswer[])
    : [];

  return (
    <CalibrationScreen
      stepIndex={stepIndex}
      onNext={(answer) => {
        const updated = [...collected, answer];
        if (stepIndex < 4) {
          router.push({
            pathname: '/(onboarding)/calibration/[step]',
            params: {
              step: String(stepIndex + 1),
              answers: JSON.stringify(updated),
            },
          });
        } else {
          router.replace({
            pathname: '/(onboarding)/results',
            params: { answers: JSON.stringify(updated) },
          });
        }
      }}
      onBack={() => {
        if (stepIndex > 0) {
          router.back();
        } else {
          router.replace('/(onboarding)');
        }
      }}
    />
  );
}
