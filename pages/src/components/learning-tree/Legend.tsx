import React, { useState, useEffect } from "react";
import { Button, Divider, Tooltip, Box, Typography } from "@mui/material";
import { styled, alpha } from '@mui/material/styles';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';
import "./assets/css/legend.css";
import DescriptionIcon from "@mui/icons-material/Description";
import { Link, useNavigate } from "react-router-dom";

/**
 * The LeftPanelProps interface represents the props that the LeftPanel component receives.
 */
interface LeftPanelProps {
  forceRefresh?: (section: string) => void;
}

interface nodeData {
  title: string;
  section: string;
  linkToTree: string;
}

interface section {
  title: string;
  nodes: nodeData[];
  linkToTree: string;
}



// Get node data from backend
const get_all_nodes = async () => {

  // Use correct url depending on environment
  const parts: string[] = window.location.href.split("/");
  let baseUrl: string = "";
  if (parts[2] === "127.0.0.1:3000" || parts[2] === "localhost:3000") {
    baseUrl = `${parts[0]}//127.0.0.1:8000`;
  } else {
    baseUrl = `${parts[0]}//${parts[2]}`;
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/learning-tree/all-nodes`);
    if (!response.ok) {
      throw new Error("Failed to fetch nodes");
    }
    const data = await response.json();
    return data.nodes || [];
  } catch (error) {
    console.error("Error fetching sections:", error);
    // Fallback to mock data if API fails
    return {
      "AI Basics": [
        {
          title: "Introduction to AI",
          section: "AI Basics",
          linkToTree: "/learning-tree?node=1"
        }
      ]
    }
  }
}

// Create MUI X Tree View Object to display tree of dropdowns
const create_MUI_X_TreeView = async () => {
  const treeView: TreeViewBaseItem[] = [];
  const nodes = await get_all_nodes();

  for (const sectionName of Object.keys(nodes)) {
    const sectionNodes = nodes[sectionName];
    let children = [];
    for (const node of sectionNodes) {
      children.push({
        id: node.title,
        label: node.title,
        linkToTree: node.linkToTree
      });
    }
    treeView.push({
      id: sectionName,
      label: sectionName,
      children: children
    });
  }

  console.log("Tree View:", treeView);

  return treeView;
}

const createButtons = (sections: nodeData[]) => {
  return sections.map((section, index) => (
    <Tooltip 
      key={index}
      title={section.title}
      placement="right"
    >
      <Button
        component={Link}
        to={section.linkToTree}
        style={{ 
          textAlign: "left", 
          width: "100%",
          color: "white",
          justifyContent: "flex-start",
          padding: "8px 16px",
          margin: "4px 0",
          transition: "all 0.2s ease-in-out",
          borderRadius: "8px",
        }}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(4px)',
          }
        }}
        startIcon={<DescriptionIcon />}
      >
        {section.section}
      </Button>
    </Tooltip>
  ));
};

/* 
Reads all files within the 'learning-tree-nodes' directory and creates node objects for each 
to eventually generate the Directory. 
*/
const getSections = async (): Promise<nodeData[]> => {
  try {
    const parts: string[] = window.location.href.split("/");
    let baseUrl: string = "";
    if (parts[2] === "127.0.0.1:3000" || parts[2] === "localhost:3000") {
      baseUrl = `${parts[0]}//127.0.0.1:8000`;
    } else {
      baseUrl = `${parts[0]}//${parts[2]}`;
    }
    
    const response = await fetch(`${baseUrl}/api/v1/learning-tree/sections`);
    if (!response.ok) {
      throw new Error("Failed to fetch sections");
    }
    
    const data = await response.json();
    return data.sections || [];
  } catch (error) {
    console.error("Error fetching sections:", error);
    // Fallback to mock data if API fails
    return [
      {
        title: "Introduction to AI",
        section: "AI Basics",
        linkToTree: "/learning-tree?node=1"
      },
      {
        title: "Machine Learning Fundamentals",
        section: "ML Basics", 
        linkToTree: "/learning-tree?node=2"
      },
      {
        title: "Deep Learning",
        section: "DL Basics",
        linkToTree: "/learning-tree?node=3"
      }
    ];
  }
};

/**
 * The Legend component displays the learning tree legend/navigation.
 * @param {LeftPanelProps} props - The props to be passed to the Legend component.
 * @returns {JSX.Element} The Legend component.
 */
const Legend = (props: LeftPanelProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<nodeData[]>([]);
  const [directory, setDirectory] = useState<TreeViewBaseItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Legend component mounted");

    const fetchDirectory = async () => {
      setDirectory(await create_MUI_X_TreeView());
    };
    fetchDirectory();
    
    // Get sections for learning tree
    const fetchSections = async () => {
      console.log("Fetching sections...");
      const treeSections = await getSections();
      console.log("Sections fetched:", treeSections);
      setSections(treeSections);
    };
    fetchSections();

    // Fetch categories from API
    const parts: string[] = window.location.href.split("/");
    let baseUrl: string = "";
    if (parts[2] === "127.0.0.1:3000" || parts[2] === "localhost:3000") {
      baseUrl = `${parts[0]}//127.0.0.1:8000`;
    } else {
      baseUrl = `${parts[0]}//${parts[2]}`;
    }
    
    fetch(`${baseUrl}/api/v1/library/tags/articles`)
      .then((response: Response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((data: string) => {
        const json = JSON.parse(data)["response"];
        let buttons: any[] = [];
        Object.keys(json).forEach((key: string) => {
          buttons.push(
            <Button
              key={key}
              style={{ textAlign: "left", color: "white" }}
              component={Link}
              to={`/library?nav=Articles&type=${json[key]}`}
            >
              {json[key]}
            </Button>
          );
        });
        setCategories(buttons);
      })
      .catch((error: Error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  console.log("Legend rendering with sections:", sections.length, "categories:", categories.length);

  const findItemLink = (items: TreeViewBaseItem[], targetItemId: string): string | null => {
    for (const treeItem of items) {
      if (treeItem.id === targetItemId && 'linkToTree' in treeItem) {
        return (treeItem as any).linkToTree;
      }
      if (treeItem.children) {
        const found = findItemLink(treeItem.children, targetItemId);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * The Legend component.
   */
  return (
    <div className="left-panel" style={{ zIndex: 0 }}>
      <h2 className="header">
        <a href="/learning-tree">Learning Tree</a>
      </h2>
      
      {/* Learning Tree Sections */}
      <Divider
        sx={{ borderColor: "white", margin: "0rem 1rem" }}
        aria-hidden="true"
      />
      <div className="navigation" style={{ 
        height: 'calc(100vh - 125px)', 
        overflowY: 'auto',
        marginRight: '16px'
      }}>
        <RichTreeView
          items={directory}
          defaultExpandedItems={[]}
          onItemClick={(event, itemId) => {
            const link = findItemLink(directory, itemId);
            if (link) navigate(link);
          }}
          sx={{
            color: 'white',
            height: '100%',
            '& .MuiTreeItem-content': {
              color: 'white',
              borderRadius: '8px',
              margin: '2px 0',
              paddingRight: '16px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateX(4px)',
              },
              '&.Mui-focused, &.Mui-selected': {
                backgroundColor: 'rgba(5, 120, 255, 0.2)',
                border: '1px solid rgba(5, 120, 255, 0.5)',
              },
            },
            '& .MuiTreeItem-label': {
              color: 'white',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '0.75rem',
              textAlign: 'left',
              justifyContent: 'flex-start',
            },
            '& .MuiTreeItem-iconContainer': {
              color: 'white',
              '& svg': {
                color: 'white',
              },
            },
            '& .MuiTreeItem-group': {
              marginLeft: '16px',
              paddingRight: '16px',
            },
          }}
        />
      </div>
    </div>
  );
};

export default Legend;
