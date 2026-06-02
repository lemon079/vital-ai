import { END } from "@langchain/langgraph";
import { AgentState } from "./state";

/**
 * GUARDRAILS LOGIC
 * Checks if message was blocked
 */
function routeGuardrails(state: typeof AgentState.State) {
    if (state.isblocked) {
        console.log("[Router] Guardrails blocked message. Ending.");
        return END;
    }
    console.log("[Router] Guardrails passed. Routing to start.");
    return "route_start";
}
