import { useState, useEffect } from "react";
import { Button, Divider, Tooltip } from "@mui/material";
import "./assets/css/legend.css";
import DescriptionIcon from "@mui/icons-material/Description";
import { Link } from "react-router-dom";

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

interface category {
  title: string;
  id: string;
  children: nodeData[];
}

/* Map nodes to each category */
const categoryMap: Map<string, category> = new Map();

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
          margin: "4px 0"
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

  useEffect(() => {
    console.log("Legend component mounted");
    
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
              style={{ textAlign: "left" }}
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

  /**
   * The Legend component.
   */
  return (
    <div className="left-panel" style={{ zIndex: 1000 }}>
      <h2 className="header">
        <a href="/learning-tree">Learning Tree</a>
      </h2>
      
      {/* Learning Tree Sections */}
      <Divider
        sx={{ borderColor: "white", margin: "0rem 1rem" }}
        aria-hidden="true"
      />
      <div className="navigation">
        {sections.length > 0 ? createButtons(sections) : <div>Loading sections...</div>}
      </div>
    </div>
  );
};

export default Legend;
