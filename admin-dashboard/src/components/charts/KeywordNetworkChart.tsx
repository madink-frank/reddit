import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Slider } from '../ui/slider';
import { 
  Network, 
  Download, 
  Settings, 
  RefreshCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

export interface KeywordNode {
  id: string;
  word: string;
  frequency: number;
  sentiment: number;
  category?: string;
  subreddit?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface KeywordEdge {
  source: string | KeywordNode;
  target: string | KeywordNode;
  weight: number;
  type: 'cooccurrence' | 'semantic' | 'temporal';
  strength?: number;
}

export interface KeywordNetworkData {
  nodes: KeywordNode[];
  edges: KeywordEdge[];
}

interface KeywordNetworkChartProps {
  data: KeywordNetworkData;
  title?: string;
  className?: string;
  height?: number;
  width?: number;
  onNodeClick?: (node: KeywordNode) => void;
  onEdgeClick?: (edge: KeywordEdge) => void;
  onExport?: (data: KeywordNetworkData) => void;
  isLoading?: boolean;
  error?: string;
}

type LayoutType = 'force' | 'circular' | 'hierarchical' | 'grid';
type ColorMode = 'frequency' | 'sentiment' | 'category' | 'subreddit';

export const KeywordNetworkChart: React.FC<KeywordNetworkChartProps> = ({
  data,
  title = "Keyword Network Visualization",
  className = '',
  height = 600,
  width = 800,
  onNodeClick,
  onEdgeClick,
  onExport,
  isLoading = false,
  error
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('force');
  const [colorMode, setColorMode] = useState<ColorMode>('frequency');
  const [nodeSize, setNodeSize] = useState([20]);
  const [edgeThickness, setEdgeThickness] = useState([2]);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KeywordNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data.nodes.length) return { nodes: [], edges: [] };

    // Calculate node sizes based on frequency
    const maxFreq = Math.max(...data.nodes.map(n => n.frequency));
    const minFreq = Math.min(...data.nodes.map(n => n.frequency));
    
    const nodes = data.nodes.map(node => ({
      ...node,
      size: Math.max(10, Math.min(50, ((node.frequency - minFreq) / (maxFreq - minFreq)) * 40 + 10)),
      color: getNodeColor(node, colorMode)
    }));

    // Filter edges based on weight threshold
    const edges = data.edges.filter(edge => edge.weight > 0.1);

    return { nodes, edges };
  }, [data, colorMode]);

  const getNodeColor = (node: KeywordNode, mode: ColorMode): string => {
    switch (mode) {
      case 'frequency':
        const freqIntensity = Math.min(1, node.frequency / 100);
        return `hsl(220, 70%, ${90 - freqIntensity * 40}%)`;
      
      case 'sentiment':
        if (node.sentiment > 0.1) return '#10B981'; // Green for positive
        if (node.sentiment < -0.1) return '#EF4444'; // Red for negative
        return '#6B7280'; // Gray for neutral
      
      case 'category':
        const categoryColors: { [key: string]: string } = {
          'technology': '#3B82F6',
          'social': '#8B5CF6',
          'business': '#F59E0B',
          'entertainment': '#EC4899',
          'default': '#6B7280'
        };
        return categoryColors[node.category || 'default'] || categoryColors.default;
      
      case 'subreddit':
        const subredditColors: { [key: string]: string } = {
          'programming': '#3B82F6',
          'technology': '#10B981',
          'webdev': '#F59E0B',
          'javascript': '#EF4444',
          'default': '#6B7280'
        };
        return subredditColors[node.subreddit || 'default'] || subredditColors.default;
      
      default:
        return '#3B82F6';
    }
  };

  const getEdgeColor = (edge: KeywordEdge): string => {
    switch (edge.type) {
      case 'cooccurrence':
        return '#3B82F6';
      case 'semantic':
        return '#10B981';
      case 'temporal':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  // Layout algorithms
  const applyLayout = (nodes: KeywordNode[], edges: KeywordEdge[], type: LayoutType) => {
    const centerX = width / 2;
    const centerY = height / 2;

    switch (type) {
      case 'circular':
        return nodes.map((node, index) => {
          const angle = (2 * Math.PI * index) / nodes.length;
          const radius = Math.min(width, height) * 0.3;
          return {
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });

      case 'grid':
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const cellWidth = width / cols;
        const cellHeight = height / Math.ceil(nodes.length / cols);
        
        return nodes.map((node, index) => ({
          ...node,
          x: (index % cols) * cellWidth + cellWidth / 2,
          y: Math.floor(index / cols) * cellHeight + cellHeight / 2
        }));

      case 'hierarchical':
        // Simple hierarchical layout based on frequency
        const sortedNodes = [...nodes].sort((a, b) => b.frequency - a.frequency);
        const levels = 3;
        const nodesPerLevel = Math.ceil(nodes.length / levels);
        
        return sortedNodes.map((node, index) => {
          const level = Math.floor(index / nodesPerLevel);
          const posInLevel = index % nodesPerLevel;
          const levelWidth = width / (nodesPerLevel + 1);
          
          return {
            ...node,
            x: (posInLevel + 1) * levelWidth,
            y: (level + 1) * (height / (levels + 1))
          };
        });

      case 'force':
      default:
        // Simple force-directed layout simulation
        return nodes.map((node, index) => ({
          ...node,
          x: centerX + (Math.random() - 0.5) * width * 0.8,
          y: centerY + (Math.random() - 0.5) * height * 0.8
        }));
    }
  };

  const layoutedNodes = useMemo(() => {
    return applyLayout(processedData.nodes, processedData.edges, layoutType);
  }, [processedData, layoutType, width, height]);

  const handleNodeClick = (node: KeywordNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
    onNodeClick?.(node);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev / 1.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(data);
    } else {
      // Export as SVG
      if (svgRef.current) {
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keyword-network.svg';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading network data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading network data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {title}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Layout Selector */}
            <Select value={layoutType} onValueChange={(value: LayoutType) => setLayoutType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="force">Force</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Color Mode Selector */}
            <Select value={colorMode} onValueChange={(value: ColorMode) => setColorMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="subreddit">Subreddit</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Node Size: {nodeSize[0]}</label>
            <Slider
              value={nodeSize}
              onValueChange={setNodeSize}
              max={50}
              min={5}
              step={5}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Edge Thickness: {edgeThickness[0]}</label>
            <Slider
              value={edgeThickness}
              onValueChange={setEdgeThickness}
              max={5}
              min={1}
              step={1}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLabels"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            <label htmlFor="showLabels" className="text-sm font-medium">Show Labels</label>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline">Nodes: {layoutedNodes.length}</Badge>
          <Badge variant="outline">Edges: {processedData.edges.length}</Badge>
          <Badge variant="outline">Zoom: {(zoom * 100).toFixed(0)}%</Badge>
          {selectedNode && (
            <Badge variant="default">
              Selected: {selectedNode.word} (freq: {selectedNode.frequency})
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
          style={{ height: isFullscreen ? 'calc(100vh - 300px)' : height }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${-pan.x} ${-pan.y} ${width / zoom} ${height / zoom}`}
            className="cursor-move"
          >
            {/* Edges */}
            <g className="edges">
              {processedData.edges.map((edge, index) => {
                const sourceNode = layoutedNodes.find(n => n.id === edge.source);
                const targetNode = layoutedNodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <line
                    key={index}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={getEdgeColor(edge)}
                    strokeWidth={edge.weight * edgeThickness[0]}
                    opacity={0.6}
                    className="cursor-pointer hover:opacity-100"
                    onClick={() => onEdgeClick?.(edge)}
                  />
                );
              })}
            </g>
            
            {/* Nodes */}
            <g className="nodes">
              {layoutedNodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={(node as any).size * (nodeSize[0] / 20)}
                    fill={(node as any).color}
                    stroke={selectedNode?.id === node.id ? '#000' : '#fff'}
                    strokeWidth={selectedNode?.id === node.id ? 3 : 1}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleNodeClick(node)}
                  />
                  
                  {showLabels && (
                    <text
                      x={node.x}
                      y={node.y + (node as any).size + 15}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#374151"
                      className="pointer-events-none select-none"
                    >
                      {node.word}
                    </text>
                  )}
                </g>
              ))}
            </g>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Node Colors ({colorMode})</h4>
              <div className="space-y-1 text-sm">
                {colorMode === 'sentiment' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Positive sentiment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Negative sentiment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      <span>Neutral sentiment</span>
                    </div>
                  </>
                )}
                {colorMode === 'frequency' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>Darker = Higher frequency</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Edge Types</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-500" />
                  <span>Co-occurrence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-green-500" />
                  <span>Semantic similarity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-yellow-500" />
                  <span>Temporal correlation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};