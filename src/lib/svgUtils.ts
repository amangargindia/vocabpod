/**
 * Cleans an SVG string by stripping out markdown code block markers
 * (e.g. ```svg ... ```) and leading/trailing whitespace.
 */
export function cleanSvgString(svgStr: string | null | undefined): string {
  if (!svgStr) return "";
  let clean = svgStr.trim();
  // Remove starting ```svg or ```xml or ```
  clean = clean.replace(/^```[a-zA-Z0-9]*\s*/, "");
  // Remove ending ```
  clean = clean.replace(/\s*```$/, "");
  
  // Slow down fast SMIL animations (e.g. dur="0.5s" -> dur="3s")
  clean = clean.replace(/dur="([0-9.]+)s"/g, (match, p1) => {
    const dur = parseFloat(p1);
    if (dur < 3) {
      return `dur="${Math.max(3, dur * 3)}s"`;
    }
    return match;
  });

  return clean.trim();
}
