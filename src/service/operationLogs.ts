export interface OperationLogItem {
  recordId: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  input: unknown;
  output: unknown;
  apitype: string;
}

export const operation_logs: OperationLogItem[] = [];

const createRecordId = (): string => {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const addOperationLog = (
  payload: Omit<OperationLogItem, "recordId" | "timestamp">
): OperationLogItem => {
  const item: OperationLogItem = {
    recordId: createRecordId(),
    timestamp: new Date().toISOString(),
    ...payload,
  };

  operation_logs.push(item);
  return item;
};
