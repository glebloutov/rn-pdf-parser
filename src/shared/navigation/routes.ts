export enum Routes {
  ChargeDetails = 'ChargeDetails',
  Diagnostics = 'Diagnostics',
  ImportHome = 'ImportHome',
}

export type RootStackParamList = {
  [Routes.ChargeDetails]: { chargeId: string };
  [Routes.Diagnostics]: undefined;
  [Routes.ImportHome]: undefined;
};
