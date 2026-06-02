
# MCP integration Nots:

- the mcp tools gonan be just wrapperes on the endpoints that we alreay have on our api/php
- the agent also has a bunchf ot tools see of we can unfiy those at a registry (and maybe exporse the whole agent capabitles as an mcp not the todo maybe , for rearch , but at least he genral tools (that interacte with the system , list/get/decide/report ect shoudl be abstracted somewhow))
- the auth questiosn is stil on the able we need oauth implemented to be able the agent/mcp to connect to our server seampless
- defin the tool in one register (with the ai sdk `tool` , unifvalrs one , i dont know , then adapte it to each one need it , notice nowthe mcp skd expects a diffrent shape ) each one can take those toolsa nd reuse htem , agent , mcp , future sidebar assitenat ect 
- the mcp server stats clean just register the tools it needs
- btw , tf is `phpfetch` naem things accordinaly, client/api ect why tied  to php , anyway we
- also apply YAGNI ,for the mcp server   no resocures. prompts ,for now just expose tools as requested 