import React, { useState, useRef } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs"; // For syntax highlighting
import "prismjs/themes/prism.css"; // Import a Prism theme
import "prismjs/components/prism-python"; // Add Python language support


const CodeEditorWithSuggestions = () => {
    const [code, setCode] = useState("# happy coding!\n");
    const [suggestions, setSuggestions] = useState([]);
    const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
    const [displayInfo, setDisplayInfo] = useState([]);
    const editorRef = useRef();

    const handleOutsideClick = () => {
        setSuggestions([]);
    }

    // Highlight function for syntax highlighting
    const highlightCode = (code) =>
        Prism.highlight(code, Prism.languages.python, "python");

    const handleChange = (newCode) => {
        setCode(newCode);
        generateLineNumbers(cursorPosition.line+1);
        
        const codeLines = newCode.split('\n')
        const lines = codeLines.length;
        const columns = codeLines[codeLines.length-1].length;
        setCursorPosition({line: lines, column: columns}); // {line: 0, column: 0}
    };

    // Insert suggestion into the code
    const handleSuggestionClick = (suggestion, index) => {
        const N = suggestions.length;
        const booleanArray = new Array(N).fill(false);
        if (index >= 0 && index < N) {
            booleanArray[index] = true;
        }
        setDisplayInfo(booleanArray);
    };
    
    const handleKeyDown = async (event) => {
        if (event.key === "Tab") {
          event.preventDefault(); // Prevent the default tab behavior
          console.log("== Running inference on the following code ==")
          console.log(code);

          const response = await fetch('http://127.0.0.1:5000/suggest', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({'code_context': code}),
            });

            if(response.ok){
                const data = await response.json();  // Parse the JSON response
                console.log("response 200 OK")
                console.log(data)
                setSuggestions(data.suggestions);
                console.log(data.message);  // Access JSON fields
                console.log(data.suggestions);
            } else {
                console.error('Error:', response.status, response.statusText);
            }
        }
      };

      const generateLineNumbers = (numLines) => {
        const lineNumbersDiv = document.getElementById('lineNumbers');
        lineNumbersDiv.innerHTML = ''; // Clear existing line numbers
  
        for (let i = 1; i <= numLines; i++) {
          const lineNumberDiv = document.createElement('div');
          lineNumberDiv.classList.add('line');
          lineNumberDiv.textContent = i;
          lineNumbersDiv.appendChild(lineNumberDiv);
        }
      };

    return (
        // 
        <div style={{ position: "relative", display: "flex", margin: "20px", maxWidth: "100%" }}>
            <div 
                className="line-numbers" 
                id="lineNumbers"
                style={{
                    width: "30px",
                    backgroundColor: "#f5f5f5",
                    textAlign: "right",
                    padding: "20px",
                    borderRight: "2px solid #ddd",
                    fontSize: "14px",
                    fontFamily: "'Fira Code', monospace",
                    color: "#808080"
                }}
            >
            </div>
            {/* code editor */}
            <div
                ref={editorRef}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 14,
                    position: "relative",
                    flexGrow: 1
                }}
            >
                <Editor
                    value={code}
                    onValueChange={handleChange}
                    highlight={highlightCode}
                    padding={10}
                    style={{
                        minHeight: "90vh"
                    }}
                    onKeyDown={handleKeyDown}
                    onClick={handleOutsideClick}
                />
            </div>

            {suggestions.length > 0 && (
                <ul
                    style={{
                        position: "absolute",
                        top: `${cursorPosition.line * 14 + 45}px`,    // cursorPosition?.top || 0
                        left: `${cursorPosition.column * 14 + 60}px`, // cursorPosition?.left || 0
                        listStyle: "none",
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "0",
                        margin: 0,
                        zIndex: 10,
                        width: "300px",
                    }}
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion, index)}
                            style={{
                                padding: "5px 10px",
                                backgroundColor: "#f0f0f0", // "transparent", //index === 0 ? "#f0f0f0" 
                                fontFamily: "'Fira Code', monospace",
                                fontSize: 14,
                                whiteSpace: "normal",
                                wordWrap: "break-word",
                                wordBreak: "break-word"
                            }}
                            onMouseEnter={(e) => (e.target.style.background = "#e6e6e6")}
                            onMouseLeave={(e) => (e.target.style.background = "#f9f9f9")}
                        >
                            {suggestion["name"]} <em>({Array.isArray(suggestion["type"]) ? suggestion["type"].join('|'): suggestion["type"]})</em>
                            {displayInfo[index] && (
                                <ul
                                onMouseEnter={(e) => (e.target.style.background = "#e6e6e6")}
                                onMouseLeave={(e) => (e.target.style.background = "#f9f9f9")}
                                >
                                    {suggestion["description"] && (<li>{suggestion["description"]}</li>)}
                                    {suggestion["default_value"] && (<li>{"default: " + suggestion["default_value"]}</li>)}
                                    {suggestion["suggestions"].length > 0 && (<li>{"Suggested values: " + suggestion["suggestions"]}</li>)}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CodeEditorWithSuggestions;
