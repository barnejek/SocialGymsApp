const ts=require("typescript");
const fs=require("fs");
const map={
 "/tmp/base/src_lib_mockBackend.ts":"ts",
 "/tmp/base/src_hooks_useGeminiLive.ts":"ts",
 "/tmp/base/src_hooks_useDemoSession.ts":"ts",
 "/tmp/base/src_components_social-gyms_TrinityCoachSession.tsx":"tsx",
};
for(const f in map){
  if(!fs.existsSync(f)){console.log("missing",f);continue;}
  const code=fs.readFileSync(f,"utf8");
  const sf=ts.createSourceFile(f,code,ts.ScriptTarget.Latest,true,map[f]==="tsx"?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const diags=sf.parseDiagnostics||[];
  console.log(`\n## BASELINE ${f.split("/").pop()} -> ${diags.length} diagnostics`);
  for(const d of diags.slice(0,5)){const lc=sf.getLineAndCharacterOfPosition(d.start);console.log(`  (${lc.line+1},${lc.character+1}) ${ts.flattenDiagnosticMessageText(d.messageText,"\n")}`);}
}
