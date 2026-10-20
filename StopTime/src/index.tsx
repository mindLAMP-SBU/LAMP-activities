import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { createRoot } from "react-dom/client";
import Board from "./components/Board";
import { EDITOR_PROTOCOL, buildManifest, reply } from "./components/editor";
import "./index.css";

let root: ReturnType<typeof createRoot> | null = null;
// Bumped for every preview so each one mounts a fresh board.
let previewCount = 0;

function render(element: React.ReactElement) {
  if (!root) {
    const rootElement = document.getElementById("root");
    if (rootElement) {
      root = createRoot(rootElement);
    }
  }
  if (root) {
    root.render(element);
  }
}

// A dashboard's activity editor talks to the activity through `lamp_editor`
// messages (see components/editor.ts). Participant launches never send one.
function handleEditorMessage(e: MessageEvent, message: any) {
  switch (message?.type) {
    case "describe":
      reply(e.source, {
        type: "manifest",
        requestId: message.requestId,
        protocol: EDITOR_PROTOCOL,
        manifest: buildManifest(),
      });
      return;
    case "preview": {
      const settings = message.settings ?? {};
      render(
        <Board
          key={`preview-${++previewCount}`}
          data={{ configuration: message.configuration, settings, activity: { settings } }}
          preview={{
            categoryIndex: Number(message.target?.categoryIndex) || 0,
            optionIndex: Number(message.target?.optionIndex) || 0,
          }}
        />
      );
      return;
    }
  }
}

window.addEventListener(
  "message",
  (e: any) => {
    const data = e.data;
    if (data && typeof data === "object" && data.lamp_editor) {
      handleEditorMessage(e, data.lamp_editor);
      return;
    }
    if (
      !data ||
      typeof data !== "object" ||
      (!data.configuration && !data.activity && !data.settings)
    ) {
      return;
    }
    render(<Board data={data} />);
  },
  false
);
