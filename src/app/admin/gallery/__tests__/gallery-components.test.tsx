/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { GalleryImageRecord } from "@/types/gallery";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock server actions
const mockUploadGalleryImages = vi.fn();
const mockDeleteGalleryImage = vi.fn();
const mockReorderGalleryImages = vi.fn();
const mockUpdateGalleryImage = vi.fn();

vi.mock("@/actions/admin/gallery", () => ({
  uploadGalleryImages: (...args: unknown[]) =>
    mockUploadGalleryImages(...args),
  deleteGalleryImage: (...args: unknown[]) =>
    mockDeleteGalleryImage(...args),
  reorderGalleryImages: (...args: unknown[]) =>
    mockReorderGalleryImages(...args),
  updateGalleryImage: (...args: unknown[]) =>
    mockUpdateGalleryImage(...args),
}));

// Mock @dnd-kit/core — DnD is complex to test in jsdom so we mock it
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const result = [...arr as unknown[]];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

// ─── Component imports (after mocks) ─────────────────────────────────────────

import { GalleryUploadZone } from "../GalleryUploadZone";
import { GalleryGrid } from "../GalleryGrid";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockImage(overrides: Partial<GalleryImageRecord> = {}): GalleryImageRecord {
  return {
    id: "img-1",
    blobUrl: "https://blob.vercel.com/gallery/test-image.png",
    alt: "A test gallery image",
    width: 1200,
    height: 800,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

// ─── Tests: GalleryUploadZone ─────────────────────────────────────────────────

describe("GalleryUploadZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Client-side validation — file size (Requirement 1.2)", () => {
    it("shows validation error when a file exceeds 4 MB", async () => {
      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");

      // Create a file that is 5 MB (exceeds 4 MB limit)
      const oversizedFile = createMockFile("large-photo.png", 5 * 1024 * 1024, "image/png");

      const dataTransfer = {
        files: [oversizedFile],
        items: [{ kind: "file", type: "image/png", getAsFile: () => oversizedFile }],
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/4 MB maximum file size limit/i)).toBeInTheDocument();
      });

      // Should NOT call the upload action
      expect(mockUploadGalleryImages).not.toHaveBeenCalled();
    });

    it("accepts files exactly at 4 MB", async () => {
      mockUploadGalleryImages.mockResolvedValue({
        uploaded: [{ id: "img-1", blobUrl: "https://blob.test/img.png", filename: "exact.png" }],
        errors: [],
      });

      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");
      const exactFile = createMockFile("exact.png", 4 * 1024 * 1024, "image/png");

      const dataTransfer = {
        files: [exactFile],
        items: [{ kind: "file", type: "image/png", getAsFile: () => exactFile }],
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(mockUploadGalleryImages).toHaveBeenCalled();
      });
    });
  });

  describe("Client-side validation — file type (Requirement 1.3)", () => {
    it("shows validation error for non-JPEG/PNG/WebP files", async () => {
      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");
      const gifFile = createMockFile("animated.gif", 500000, "image/gif");

      const dataTransfer = {
        files: [gifFile],
        items: [{ kind: "file", type: "image/gif", getAsFile: () => gifFile }],
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid file type.*Accepted formats: JPEG, PNG, WebP/i)
        ).toBeInTheDocument();
      });

      expect(mockUploadGalleryImages).not.toHaveBeenCalled();
    });

    it("accepts JPEG, PNG, and WebP files", async () => {
      mockUploadGalleryImages.mockResolvedValue({
        uploaded: [
          { id: "img-1", blobUrl: "https://blob.test/1.jpg", filename: "photo.jpg" },
          { id: "img-2", blobUrl: "https://blob.test/2.png", filename: "photo.png" },
          { id: "img-3", blobUrl: "https://blob.test/3.webp", filename: "photo.webp" },
        ],
        errors: [],
      });

      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");
      const jpegFile = createMockFile("photo.jpg", 1000000, "image/jpeg");
      const pngFile = createMockFile("photo.png", 1000000, "image/png");
      const webpFile = createMockFile("photo.webp", 1000000, "image/webp");

      const dataTransfer = {
        files: [jpegFile, pngFile, webpFile],
        items: [
          { kind: "file", type: "image/jpeg", getAsFile: () => jpegFile },
          { kind: "file", type: "image/png", getAsFile: () => pngFile },
          { kind: "file", type: "image/webp", getAsFile: () => webpFile },
        ],
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(mockUploadGalleryImages).toHaveBeenCalled();
      });
    });
  });

  describe("Client-side validation — batch count limit (Requirement 1.5)", () => {
    it("shows validation error when more than 10 files are dropped", async () => {
      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");

      // Create 11 valid files
      const files = Array.from({ length: 11 }, (_, i) =>
        createMockFile(`photo-${i}.png`, 500000, "image/png")
      );

      const dataTransfer = {
        files,
        items: files.map((f) => ({
          kind: "file",
          type: "image/png",
          getAsFile: () => f,
        })),
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/Maximum of 10 files per upload/i)).toBeInTheDocument();
      });

      expect(mockUploadGalleryImages).not.toHaveBeenCalled();
    });

    it("accepts exactly 10 files", async () => {
      mockUploadGalleryImages.mockResolvedValue({
        uploaded: Array.from({ length: 10 }, (_, i) => ({
          id: `img-${i}`,
          blobUrl: `https://blob.test/${i}.png`,
          filename: `photo-${i}.png`,
        })),
        errors: [],
      });

      render(<GalleryUploadZone />);

      const dropZone = screen.getByRole("button");

      const files = Array.from({ length: 10 }, (_, i) =>
        createMockFile(`photo-${i}.png`, 500000, "image/png")
      );

      const dataTransfer = {
        files,
        items: files.map((f) => ({
          kind: "file",
          type: "image/png",
          getAsFile: () => f,
        })),
        types: ["Files"],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(mockUploadGalleryImages).toHaveBeenCalled();
      });
    });
  });
});

// ─── Tests: GalleryGrid ───────────────────────────────────────────────────────

describe("GalleryGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Grid rendering and image order (Requirement 5.4)", () => {
    it("renders images in sortOrder sequence", () => {
      const images = [
        createMockImage({ id: "img-1", alt: "First image", sortOrder: 0 }),
        createMockImage({ id: "img-2", alt: "Second image", sortOrder: 1 }),
        createMockImage({ id: "img-3", alt: "Third image", sortOrder: 2 }),
      ];

      render(<GalleryGrid images={images} />);

      const altTexts = screen.getAllByText(/image$/i);
      expect(altTexts[0]).toHaveTextContent("First image");
      expect(altTexts[1]).toHaveTextContent("Second image");
      expect(altTexts[2]).toHaveTextContent("Third image");
    });

    it("shows empty state when no images provided", () => {
      render(<GalleryGrid images={[]} />);

      expect(
        screen.getByText(/No gallery images yet/i)
      ).toBeInTheDocument();
    });

    it("displays the total image count", () => {
      const images = [
        createMockImage({ id: "img-1", alt: "Image one", sortOrder: 0 }),
        createMockImage({ id: "img-2", alt: "Image two", sortOrder: 1 }),
      ];

      render(<GalleryGrid images={images} />);

      expect(screen.getByText(/Gallery Images \(2\)/i)).toBeInTheDocument();
    });
  });

  describe("Delete confirmation flow (Requirement 5.4)", () => {
    it("shows confirmation dialog when delete button is clicked", async () => {
      const images = [
        createMockImage({ id: "img-del-1", alt: "Image to delete" }),
      ];

      render(<GalleryGrid images={images} />);

      // Click the delete button on the image card
      const deleteButton = screen.getByLabelText("Delete Image to delete");
      fireEvent.click(deleteButton);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText("Delete Image")).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to permanently delete/i)
        ).toBeInTheDocument();
      });
    });

    it("calls deleteGalleryImage with correct ID on confirmation", async () => {
      mockDeleteGalleryImage.mockResolvedValue({ success: true });

      const images = [
        createMockImage({ id: "img-del-2", alt: "Deletion target" }),
      ];

      render(<GalleryGrid images={images} />);

      // Open the delete confirmation
      const deleteButton = screen.getByLabelText("Delete Deletion target");
      fireEvent.click(deleteButton);

      // Click the confirm "Delete" button in the dialog
      await waitFor(() => {
        expect(screen.getByText("Delete Image")).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole("button", { name: /^Delete$/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockDeleteGalleryImage).toHaveBeenCalledWith("img-del-2");
      });
    });

    it("closes confirmation dialog when Cancel is clicked", async () => {
      const images = [
        createMockImage({ id: "img-del-3", alt: "Dismissable image" }),
      ];

      render(<GalleryGrid images={images} />);

      // Open delete confirmation
      const deleteButton = screen.getByLabelText("Delete Dismissable image");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Image")).toBeInTheDocument();
      });

      // Click the Cancel button inside the dialog (use within to scope)
      const dialog = screen.getByRole("dialog");
      // The dialog has two buttons at the bottom: "Cancel" and "Delete"
      const buttons = dialog.querySelectorAll("button");
      const cancelButton = Array.from(buttons).find(
        (btn) => btn.textContent === "Cancel"
      ) as HTMLElement;
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Delete Image")).not.toBeInTheDocument();
      });
    });

    it("removes image from grid after successful deletion", async () => {
      mockDeleteGalleryImage.mockResolvedValue({ success: true });

      const images = [
        createMockImage({ id: "img-del-4", alt: "Will be removed" }),
        createMockImage({ id: "img-keep", alt: "Will stay", sortOrder: 1 }),
      ];

      render(<GalleryGrid images={images} />);

      // Open delete confirmation for first image
      const deleteButton = screen.getByLabelText("Delete Will be removed");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Image")).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmDeleteButton = screen.getByRole("button", { name: /^Delete$/i });
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.queryByText("Will be removed")).not.toBeInTheDocument();
      });

      // Second image should still be there
      expect(screen.getByText("Will stay")).toBeInTheDocument();
    });
  });
});
