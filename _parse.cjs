const ts=require("typescript");
const fs=require("fs");
const files=["src/lib/mockBackend.ts","src/hooks/useGeminiLive.ts","src/hooks/useDemoSession.ts","src/components/social-gyms/TrinityCoachSession.tsx"];
for(const f of files){
  const code=fs.readFileSync(f,"utf8");
  const sf=ts.createSourceFile(f,code,ts.ScriptTarget.Latest,true,f.endsWith("tsx")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const diags=sf.parseDiagnostics||[];
  console.log(`\n## ${f} -> ${diags.length} parse diagnostics`);
  for(const d of diags.slice(0,8)){
    const {line,character}=sf.getLineAndCharacterOfPosition(d.start);
    console.log(`  (${line+1},${character+1}) ${ts.flattenDiagnosticMessageText(d.messageText,"\n")}`);
  }
}
