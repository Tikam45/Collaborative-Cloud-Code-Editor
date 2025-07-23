#include <SDL.h>
#include <iostream>

// Plot the four mirrored points
void plotEllipsePoints(SDL_Renderer* r, int xc, int yc, int x, int y) {
    SDL_RenderDrawPoint(r, xc + x, yc + y);
    SDL_RenderDrawPoint(r, xc - x, yc + y);
    SDL_RenderDrawPoint(r, xc - x, yc - y);
    SDL_RenderDrawPoint(r, xc + x, yc - y);
}

void midpointEllipse(SDL_Renderer* r, int rx, int ry, int xc, int yc) {
    int x = 0, y = ry;
    long dx = 0, dy = 2L * rx * rx * y;
    long d1 = ry*ry - rx*rx*ry + rx*rx/4;
    // Region 1
    while (dx < dy) {
        plotEllipsePoints(r, xc, yc, x, y);
        if (d1 < 0) {
            x++; dx += 2L*ry*ry;      d1 += dx + ry*ry;
        } else {
            x++; y--; dx += 2L*ry*ry; dy -= 2L*rx*rx; d1 += dx - dy + ry*ry;
        }
    }
    // Region 2
    long d2 = ry*ry*(x+0.5)*(x+0.5) + rx*rx*(y-1)*(y-1) - rx*rx*ry*ry;
    while (y >= 0) {
        plotEllipsePoints(r, xc, yc, x, y);
        if (d2 > 0) {
            y--; dy -= 2L*rx*rx;     d2 += rx*rx - dy;
        } else {
            y--; x++; dx += 2L*ry*ry; dy -= 2L*rx*rx; d2 += dx - dy + rx*rx;
        }
    }
}

int main(int, char**) {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL_Init failed: " << SDL_GetError() << "\n";
        return 1;
    }
    SDL_Window*   win = SDL_CreateWindow("Midpoint Ellipse",
                         SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
                         500, 500, 0);
    SDL_Renderer* ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED);

    // Black background
    SDL_SetRenderDrawColor(ren, 0, 0, 0, 255);
    SDL_RenderClear(ren);

    // White ellipse
    SDL_SetRenderDrawColor(ren, 255, 255, 255, 255);
    midpointEllipse(ren, 100, 60, 250, 250);
    SDL_RenderPresent(ren);

    // Wait until window‐close or any key
    SDL_Event e;
    bool quit = false;
    while (!quit) {
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT || e.type == SDL_KEYDOWN)
                quit = true;
        }
    }

    SDL_DestroyRenderer(ren);
    SDL_DestroyWindow(win);
    SDL_Quit();
    return 0;
}
