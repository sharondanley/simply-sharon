import { MutableRefObject, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Minus, Plus, Upload } from "lucide-react";

type GridCellContentType = "paragraph" | "image" | "thumbnail";

type GridDimensions = {
  rows: number;
  columns: number;
};

type GridCell = {
  id: string;
  contentType: GridCellContentType;
  content?: string;
  url?: string;
  caption?: string;
};

type GridBlock = {
  id: string;
  type: "customGrid";
  grid?: GridDimensions;
  cells?: GridCell[];
};

type GridBlockEditorProps = {
  block: GridBlock;
  onChange: (updated: GridBlock) => void;
  dark: boolean;
  inputClass: string;
  helperClass: string;
  uploadingCellId: string | null;
  gridFileInputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  handleGridCellUpload: (cellId: string, file?: File) => Promise<void>;
};

const MAX_GRID_SIZE = 10;
const MIN_GRID_SIZE = 1;

function generateId() {
  return Math.random().toString(36).slice(2);
}

function clampGridValue(value: number) {
  return Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, Math.round(value || MIN_GRID_SIZE)));
}

function sanitizeGrid(grid?: Partial<GridDimensions>): GridDimensions {
  return {
    rows: clampGridValue(grid?.rows ?? 1),
    columns: clampGridValue(grid?.columns ?? 3),
  };
}

function getCellCount(grid: GridDimensions) {
  return grid.rows * grid.columns;
}

function normalizeCell(cell?: GridCell): GridCell {
  return {
    id: cell?.id || generateId(),
    contentType: cell?.contentType || "paragraph",
    content: cell?.content || "",
    url: cell?.url || "",
    caption: cell?.caption || "",
  };
}

function ensureGridCells(grid: GridDimensions, cells?: GridCell[]) {
  const count = getCellCount(grid);
  return Array.from({ length: count }, (_, index) => normalizeCell(cells?.[index]));
}

function normalizeGridBlock(block: GridBlock): GridBlock {
  const grid = sanitizeGrid(block.grid);
  return {
    ...block,
    grid,
    cells: block.cells?.length ? block.cells.map((cell) => normalizeCell(cell)) : ensureGridCells(grid),
  };
}

function createExpandedCells(grid: GridDimensions, cells?: GridCell[]) {
  const normalized = cells?.map((cell) => normalizeCell(cell)) || [];
  const targetCount = getCellCount(grid);
  if (normalized.length >= targetCount) return normalized;
  return normalized.concat(Array.from({ length: targetCount - normalized.length }, () => normalizeCell()));
}

function SortableGridCell({
  cell,
  index,
  dark,
  inputClass,
  helperClass,
  uploadingCellId,
  gridFileInputRefs,
  handleGridCellUpload,
  onUpdate,
}: {
  cell: GridCell;
  index: number;
  dark: boolean;
  inputClass: string;
  helperClass: string;
  uploadingCellId: string | null;
  gridFileInputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  handleGridCellUpload: (cellId: string, file?: File) => Promise<void>;
  onUpdate: (updates: Partial<GridCell>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cell.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-dashed p-4 flex flex-col gap-3 shadow-sm ${
        dark
          ? "border-gray-600 bg-gray-900"
          : "border-gray-300 bg-gray-50/60"
      } ${isDragging ? "opacity-70" : "opacity-100"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
              dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"
            }`}
            {...attributes}
            {...listeners}
            title="Drag to reposition"
          >
            <GripVertical size={16} />
          </button>
          <span className={`text-sm font-bold font-['Source_Sans_3'] ${dark ? "text-gray-100" : "text-gray-800"}`}>
            Cell {index + 1}
          </span>
        </div>
        <select
          value={cell.contentType}
          onChange={(e) => onUpdate({ contentType: e.target.value as GridCellContentType })}
          className={`px-3 py-2 border rounded-lg text-sm font-['Source_Sans_3'] ${dark ? "border-gray-500 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
        >
          <option value="paragraph">Paragraph</option>
          <option value="image">Image Upload</option>
          <option value="thumbnail">Thumbnail</option>
        </select>
      </div>

      {cell.contentType === "paragraph" ? (
        <textarea
          value={cell.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Write paragraph content for this slot..."
          rows={5}
          className={inputClass + " resize-y"}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => gridFileInputRefs.current[cell.id]?.click()}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold font-['Source_Sans_3'] transition-colors ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}
            >
              <Upload size={16} /> {uploadingCellId === cell.id ? "Uploading..." : "Upload image"}
            </button>
            <span className={helperClass}>or paste an image URL</span>
          </div>
          <input
            ref={(node) => { gridFileInputRefs.current[cell.id] = node; }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleGridCellUpload(cell.id, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            type="text"
            value={cell.url || ""}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="Image URL..."
            className={inputClass}
          />
          <input
            type="text"
            value={cell.caption || ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder={cell.contentType === "thumbnail" ? "Thumbnail label (optional)" : "Caption (optional)"}
            className={inputClass}
          />
          {cell.url ? (
            <img
              src={cell.url}
              alt={cell.caption || "Grid image"}
              className={`w-full rounded-xl object-cover ${cell.contentType === "thumbnail" ? "h-28" : "max-h-56"}`}
            />
          ) : (
            <div className={`flex min-h-28 items-center justify-center rounded-xl ${dark ? "bg-gray-800 text-gray-500" : "bg-white text-gray-400"}`}>
              <ImageIcon size={28} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function GridBlockEditor({
  block,
  onChange,
  dark,
  inputClass,
  helperClass,
  uploadingCellId,
  gridFileInputRefs,
  handleGridCellUpload,
}: GridBlockEditorProps) {
  const normalizedBlock = useMemo(() => normalizeGridBlock(block), [block]);
  const grid = normalizedBlock.grid || { rows: 1, columns: 3 };
  const [hoverGrid, setHoverGrid] = useState<GridDimensions | null>(null);
  const activeCells = ensureGridCells(grid, normalizedBlock.cells);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const applyBlock = (nextGrid: GridDimensions, nextCells?: GridCell[]) => {
    onChange({
      ...normalizedBlock,
      grid: sanitizeGrid(nextGrid),
      cells: nextCells || createExpandedCells(nextGrid, normalizedBlock.cells),
    });
  };

  const updateCell = (cellId: string, updates: Partial<GridCell>) => {
    applyBlock(grid, createExpandedCells(grid, normalizedBlock.cells).map((cell) => (
      cell.id === cellId
        ? {
            ...cell,
            ...updates,
            contentType: (updates.contentType || cell.contentType) as GridCellContentType,
            content: updates.content ?? cell.content ?? "",
            url: updates.url ?? cell.url ?? "",
            caption: updates.caption ?? cell.caption ?? "",
          }
        : cell
    )));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const expanded = createExpandedCells(grid, normalizedBlock.cells);
    const oldIndex = expanded.findIndex((cell) => cell.id === active.id);
    const newIndex = expanded.findIndex((cell) => cell.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reorderedActive = arrayMove(expanded.slice(0, getCellCount(grid)), oldIndex, newIndex);
    const hiddenCells = expanded.slice(getCellCount(grid));
    applyBlock(grid, reorderedActive.concat(hiddenCells));
  };

  const adjustGrid = (field: keyof GridDimensions, delta: number) => {
    const nextGrid = sanitizeGrid({ ...grid, [field]: grid[field] + delta });
    applyBlock(nextGrid, createExpandedCells(nextGrid, normalizedBlock.cells));
  };

  const selectGrid = (nextGrid: GridDimensions) => {
    applyBlock(nextGrid, createExpandedCells(nextGrid, normalizedBlock.cells));
  };

  const previewGrid = hoverGrid || grid;

  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-2xl border p-4 ${dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-col gap-3">
          <div>
            <span className={`block text-sm font-semibold mb-1 ${dark ? "text-gray-200" : "text-gray-800"}`}>Visual Grid Selection</span>
            <p className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Hover to preview a layout, then click to create or resize the grid.
            </p>
          </div>
          <div
            className="inline-grid gap-1 w-max"
            style={{ gridTemplateColumns: `repeat(${MAX_GRID_SIZE}, minmax(0, 18px))` }}
            onMouseLeave={() => setHoverGrid(null)}
          >
            {Array.from({ length: MAX_GRID_SIZE * MAX_GRID_SIZE }, (_, index) => {
              const row = Math.floor(index / MAX_GRID_SIZE) + 1;
              const column = (index % MAX_GRID_SIZE) + 1;
              const highlighted = row <= previewGrid.rows && column <= previewGrid.columns;
              return (
                <button
                  key={`${row}-${column}`}
                  type="button"
                  onMouseEnter={() => setHoverGrid({ rows: row, columns: column })}
                  onFocus={() => setHoverGrid({ rows: row, columns: column })}
                  onClick={() => selectGrid({ rows: row, columns: column })}
                  className={`h-[18px] w-[18px] rounded-sm border transition-colors ${highlighted
                    ? dark ? "border-white bg-white" : "border-black bg-black"
                    : dark ? "border-gray-600 bg-transparent hover:border-gray-400" : "border-gray-300 bg-transparent hover:border-gray-500"
                  }`}
                  aria-label={`Select ${row} rows and ${column} columns`}
                />
              );
            })}
          </div>
          <div className={`text-sm font-bold font-['Source_Sans_3'] ${dark ? "text-gray-200" : "text-gray-800"}`}>
            {previewGrid.rows} × {previewGrid.columns}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className={`block text-sm font-semibold mb-1 ${dark ? "text-gray-200" : "text-gray-800"}`}>Dynamic Grid Editor</span>
            <p className={`text-sm font-['Source_Sans_3'] ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Drag cells to reposition them. Existing slot data is preserved when rows or columns are reduced and later restored.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={helperClass}>Rows</span>
              <button type="button" onClick={() => adjustGrid("rows", -1)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}><Minus size={16} /></button>
              <span className={`min-w-8 text-center text-sm font-bold ${dark ? "text-gray-100" : "text-gray-800"}`}>{grid.rows}</span>
              <button type="button" onClick={() => adjustGrid("rows", 1)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}><Plus size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
              <span className={helperClass}>Columns</span>
              <button type="button" onClick={() => adjustGrid("columns", -1)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}><Minus size={16} /></button>
              <span className={`min-w-8 text-center text-sm font-bold ${dark ? "text-gray-100" : "text-gray-800"}`}>{grid.columns}</span>
              <button type="button" onClick={() => adjustGrid("columns", 1)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${dark ? "border-gray-500 text-gray-200 hover:border-white hover:text-white" : "border-gray-300 text-gray-700 hover:border-black hover:text-black"}`}><Plus size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeCells.map((cell) => cell.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}>
            {activeCells.map((cell, index) => (
              <SortableGridCell
                key={cell.id}
                cell={cell}
                index={index}
                dark={dark}
                inputClass={inputClass}
                helperClass={helperClass}
                uploadingCellId={uploadingCellId}
                gridFileInputRefs={gridFileInputRefs}
                handleGridCellUpload={handleGridCellUpload}
                onUpdate={(updates) => updateCell(cell.id, updates)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
