#include <iostream>
#include <graphics.h>  // For Turbo C++ or similar environments

using namespace std;

// Function to plot symmetrical points
void plotEllipsePoints(int xc, int yc, int x, int y) {
    putpixel(xc + x, yc + y, WHITE);
    putpixel(xc - x, yc + y, WHITE);
    putpixel(xc - x, yc - y, WHITE);
    putpixel(xc + x, yc - y, WHITE);
}

// Midpoint ellipse drawing algorithm
void midpointEllipse(int rx, int ry, int xc, int yc) {
    float dx, dy, d1, d2, x, y;
    x = 0;
    y = ry;

    // Region 1
    d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx);
    dx = 2 * ry * ry * x;
    dy = 2 * rx * rx * y;

    while (dx < dy) {
        plotEllipsePoints(xc, yc, x, y);

        if (d1 < 0) {
            x++;
            dx += 2 * ry * ry;
            d1 += dx + (ry * ry);
        } else {
            x++;
            y--;
            dx += 2 * ry * ry;
            dy -= 2 * rx * rx;
            d1 += dx - dy + (ry * ry);
        }
    }

    // Region 2
    d2 = ((ry * ry) * ((x + 0.5) * (x + 0.5))) +
         ((rx * rx) * ((y - 1) * (y - 1))) -
         (rx * rx * ry * ry);

    while (y >= 0) {
        plotEllipsePoints(xc, yc, x, y);

        if (d2 > 0) {
            y--;
            dy -= 2 * rx * rx;
            d2 += (rx * rx) - dy;
        } else {
            y--;
            x++;
            dx += 2 * ry * ry;
            dy -= 2 * rx * rx;
            d2 += dx - dy + (rx * rx);
        }
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int rx = 100, ry = 60;
    int xc = 250, yc = 250;

    midpointEllipse(rx, ry, xc, yc);

    getch();
    closegraph();
    return 0;
}