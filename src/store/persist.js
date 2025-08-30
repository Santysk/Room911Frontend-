export const persist = (key, initial) => {
  const load = () => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }
  }
  const save = (data) => localStorage.setItem(key, JSON.stringify(data))
  return { load, save }
}
