// ... existing code ...
        if (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Ensure canvas is an HTMLCanvasElement before appending
        if (glContext.canvas instanceof HTMLCanvasElement) {
          container.appendChild(glContext.canvas);
        } else {
          // If it's not an HTMLCanvasElement, log an error and do not append.
          // This helps prevent runtime errors if OffscreenCanvas or another type is encountered.
          console.error(
            'Error: canvas is not an instance of HTMLCanvasElement. Cannot append to container.',
            glContext.canvas,
          );
          // Optionally, you could throw an error here or handle it differently depending on requirements.
          // For now, we just prevent the appendChild operation.
          return; // Exit the function if canvas cannot be appended
        }

        const geometry = new Triangle(glContext);
// ... existing code ...
