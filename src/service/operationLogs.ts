export interface OperationLogItem {
  recordId: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  input: unknown;
  output: unknown;
  API_Type: string;
}

export const operation_logs: OperationLogItem[] = [];

const createRecordId = (): string => {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/** 递归截断对象/数组中所有 screenshot 字段，只保留前 20 个字符 */
const truncateScreenshots = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => truncateScreenshots(item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "screenshot" && typeof val === "string") {
        result[key] = val.slice(0, 30);
      } else {
        result[key] = truncateScreenshots(val);
      }
    }
    return result;
  }
  return value;
};

export const addOperationLog = (
  payload: Omit<OperationLogItem, "recordId" | "timestamp">
): OperationLogItem => {
  const item: OperationLogItem = {
    recordId: createRecordId(),
    timestamp: new Date().toISOString(),
    ...payload,
    input: truncateScreenshots(payload.input),
    output: truncateScreenshots(payload.output),
  };

  operation_logs.push(item);
  return item;
};

/** 记录上次发送位置，consumeOperationLogs 只返回增量部分 */
let _lastSentIndex = 0;

/**
 * 返回自上次调用以来新增的日志副本。
 * operation_logs 保持完整不清空，方便其他地方使用全量日志。
 */
export const consumeOperationLogs = (): OperationLogItem[] => {
  const snapshot = operation_logs.slice(_lastSentIndex);
  _lastSentIndex = operation_logs.length;
  return snapshot;
};
