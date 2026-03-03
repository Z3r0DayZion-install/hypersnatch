const CDP = require('chrome-remote-interface');
async function test() {
    let client;
    try {
        client = await CDP({ port: 9222 });
        const { Runtime, Log, DOM } = client;

        await Runtime.enable();
        await Log.enable();
        await DOM.enable();

        // Listen for console events
        Runtime.consoleAPICalled((params) => {
            console.log(`[CONSOLE ${params.type}]`, params.args.map(a => a.value || a.description).join(' '));
        });

        // Listen for exception events
        Runtime.exceptionThrown((params) => {
            console.error(`[EXCEPTION]`, params.exceptionDetails.exception.description);
        });

        console.log('--- ATTACHED! Capturing logs for 3 seconds ---');

        // Wait 3 seconds
        await new Promise(r => setTimeout(r, 3000));

        // Try getting body html just in case
        const { root } = await DOM.getDocument();
        const body = await DOM.querySelector({ nodeId: root.nodeId, selector: 'body' });
        if (body.nodeId) {
            const html = await DOM.getOuterHTML({ nodeId: body.nodeId });
            console.log("--- DOM BODY EXTRACT ---");
            console.log(html.outerHTML.substring(0, 500) + "...");
        }

    } catch (err) {
        console.error('CDP Error:', err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}
test();
