/**
 * Read fetch response body once; parse JSON or throw a clear message (handles HTML 500 pages).
 */
export async function parseJsonOrApiError(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const hint =
      response.status >= 500
        ? `Server error (${response.status}). Check the terminal running uvicorn for the Python traceback.`
        : `Unexpected response (${response.status}).`;
    throw new Error(hint);
  }
  if (!response.ok) {
    const d = data.detail;
    const errList = data.errors;
    let msg;
    if (typeof d === 'string') {
      msg = d;
    } else if (Array.isArray(d)) {
      msg = d.map((x) => x.msg || JSON.stringify(x)).join('; ');
    } else if (d != null && typeof d === 'object') {
      msg = JSON.stringify(d);
    } else {
      msg = `Request failed (${response.status})`;
    }
    if (Array.isArray(errList) && errList.length) {
      msg = `${msg} ${JSON.stringify(errList)}`;
    }
    throw new Error(msg);
  }
  return data;
}
