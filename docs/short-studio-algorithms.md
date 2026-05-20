# Short Studio Algorithms

Source of truth: `src/lib/algorithms/index.ts`.

## Sorting

| ID | Algorithm |
| --- | --- |
| `bubble` | Bubble Sort |
| `odd_even` | Odd-Even Sort |
| `pancake` | Pancake Sort |
| `bitonic` | Bitonic Sort |
| `bogo` | Bogo Sort |
| `flash` | Flash Sort |
| `selection` | Selection Sort |
| `insertion` | Insertion Sort |
| `quick` | Quick Sort |
| `merge` | Merge Sort |
| `heap` | Heap Sort |
| `counting` | Counting Sort |
| `radix` | Radix Sort |
| `bucket` | Bucket Sort |
| `shell` | Shell Sort |
| `cocktail` | Cocktail Shaker Sort |
| `comb` | Comb Sort |
| `gnome` | Gnome Sort |
| `tim` | Tim Sort |
| `intro` | Intro Sort |
| `tree_sort` | Tree Sort |
| `cycle` | Cycle Sort |
| `pigeonhole` | Pigeonhole Sort |
| `strand` | Strand Sort |
| `tournament` | Tournament Sort |
| `smooth` | Smooth Sort |
| `stooge` | Stooge Sort |

## Searching

| ID | Algorithm |
| --- | --- |
| `linear` | Linear Search |
| `binary` | Binary Search |

## Graph

| ID | Algorithm |
| --- | --- |
| `bfs` | BFS |
| `dfs` | DFS |
| `dijkstra` | Dijkstra |
| `astar` | A* Pathfinding |

## Studio Modes

| Route | Mode | Notes |
| --- | --- | --- |
| `/` | Algorithm Shorts | Classic and kinetic short animation setup. |
| `/maze-pathfinding` | Maze Pathfinding / Tìm đường ra mê cung | Dedicated maze setup. Short 9:16 can run 1 algorithm or compare 2 algorithms stacked top/bottom. Long 16:9 compares 2 algorithms side by side. Supports escape-route and fastest-route problem types. |
| `/long-content` | Algorithm Long 16:9 | Long-form YouTube explainer setup. |

## Custom

| ID | Algorithm |
| --- | --- |
| `custom` | Custom Code |

## TODO Algorithms

These algorithms are not in Short Studio yet. `Priority` marks good first candidates for short or long video series.

### Sorting TODO

No remaining sorting TODO items in this list.

### Searching TODO

| ID | Algorithm | Priority |
| --- | --- | --- |
| `jump` | Jump Search | Short first |
| `interpolation` | Interpolation Search | Short first |
| `exponential` | Exponential Search | Short first |
| `ternary` | Ternary Search | Later |
| `fibonacci_search` | Fibonacci Search | Later |

### Graph TODO

| ID | Algorithm | Priority |
| --- | --- | --- |
| `bellman_ford` | Bellman-Ford | Later |
| `floyd_warshall` | Floyd-Warshall | Later |
| `prim` | Prim's Algorithm | First wave |
| `kruskal` | Kruskal's Algorithm | First wave |
| `topological_sort` | Topological Sort | First wave |
| `kahn` | Kahn's Algorithm | Later |
| `union_find` | Union Find / Disjoint Set | First wave |
| `tarjan_scc` | Tarjan SCC | Later |
| `kosaraju` | Kosaraju SCC | Later |
| `bridge_finding` | Bridge Finding | Later |
| `flood_fill` | Flood Fill | First wave |

### Tree TODO

| ID | Algorithm | Priority |
| --- | --- | --- |
| `preorder` | Preorder Traversal | Good visual candidate |
| `inorder` | Inorder Traversal | Good visual candidate |
| `postorder` | Postorder Traversal | Good visual candidate |
| `level_order` | Level Order Traversal | Good visual candidate |
| `bst_insert` | BST Insert | Good visual candidate |
| `bst_delete` | BST Delete | Good visual candidate |
| `avl_rotation` | AVL Tree Rotation | Good visual candidate |
| `heap_insert` | Heap Insert | Good visual candidate |
| `heap_extract` | Heap Extract Max/Min | Good visual candidate |

### Dynamic Programming TODO

| ID | Algorithm | Priority |
| --- | --- | --- |
| `fibonacci_dp` | Fibonacci DP | First wave |
| `knapsack_01` | 0/1 Knapsack | First wave |
| `coin_change` | Coin Change | First wave |
| `lcs` | Longest Common Subsequence | First wave |
| `lis` | Longest Increasing Subsequence | First wave |
| `edit_distance` | Edit Distance | Later |
| `grid_paths` | Grid Path Counting | Later |
| `house_robber` | House Robber | Later |
| `matrix_chain` | Matrix Chain Multiplication | Later |

### String TODO

| ID | Algorithm | Priority |
| --- | --- | --- |
| `kmp` | KMP String Search | First wave |
| `rabin_karp` | Rabin-Karp | First wave |
| `boyer_moore` | Boyer-Moore | Later |
| `z_algorithm` | Z Algorithm | Later |
| `manacher` | Manacher's Algorithm | Later |
| `trie_insert` | Trie Insert | First wave |
| `trie_search` | Trie Search | First wave |

### Coding Interview Patterns TODO

| ID | Pattern | Priority |
| --- | --- | --- |
| `two_pointers` | Two Pointers | Candidate |
| `sliding_window` | Sliding Window | Candidate |
| `fast_slow_pointers` | Fast & Slow Pointers | Candidate |
| `prefix_sum` | Prefix Sum | Candidate |
| `monotonic_stack` | Monotonic Stack | Candidate |
| `backtracking` | Backtracking | Candidate |
| `recursion_tree` | Recursion Tree | Candidate |
| `divide_conquer` | Divide and Conquer | Candidate |
| `greedy_activity` | Greedy Activity Selection | Candidate |

### Maze Pathfinding build catalog

This module was renamed from the temporary **Algorithm World** label to **Maze Pathfinding / Tìm đường ra mê cung**. The broader Algorithm World concept should be rebuilt later as a separate mode.

| ID | Algorithm | Runtime | Best fit | Recommended maze |
| --- | --- | --- | --- | --- |
| `dfs` | DFS | `O(V + E)` | Find any exit route | `dfs_tunnels` |
| `bfs` | BFS | `O(V + E)` | Shortest path on unweighted mazes | `bfs_rooms` |
| `dijkstra` | Dijkstra | `O(E log V)` | Fastest path when movement costs vary | `dijkstra_weighted` |
| `astar` | A* Pathfinding | `O(E log V)` | Fastest path with heuristic guidance | `astar_labyrinth` |

Maze Pathfinding tasks distinguish between `escape` (find a valid path to the exit) and `fastest` (find the quickest/shortest route to the exit). Short 9:16 can render either one algorithm or two algorithms stacked top/bottom. Long 16:9 is intended for side-by-side comparison.

#### Maze Pathfinding UI update

- Setup cards are grouped into tabs (`Setup`, `Maze`, `Algorithms`, `Frames`) to reduce vertical scrolling.
- Background music is surfaced as a standalone card on the maze page, while the general audio tab keeps SFX controls.
- VS mode disables the code overlay because the comparison layouts need the full canvas for top/bottom or left/right rendering.
- Video type now includes `Pro: Car race`, a game-like mode where each car runs a different pathfinding algorithm. The renderer uses fog-of-war cells so cars reveal the maze while searching instead of visually seeing the full map in advance.
