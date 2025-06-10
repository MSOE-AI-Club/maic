import * as fs from "fs";
import * as path from "path";
import { useState, useEffect } from "react";
import { Button, Divider, Box} from "@mui/material";
import "./assets/library/css/left-panel.css";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScienceIcon from "@mui/icons-material/Science";
import ConstructionIcon from "@mui/icons-material/Construction";
import DescriptionIcon from "@mui/icons-material/Description";
import Movie from "@mui/icons-material/Movie";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { Link } from "react-router-dom";

/**
 * The LeftPanelProps interface represents the props that the LeftPanel component receives.
 */
interface LeftPanelProps {
  
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
const categoryMap: Map<string, category> = new Map()

/* Dropdown (Tree) Object that will be used to build out the directory */
const tree: TreeViewBaseItem[] = []


/* 
Reads all files within the 'learning-tree-nodes' directory and creates node objects for each 
to eventually generate the Directory. 
*/
const getSections = (directoryPath: string): nodeData[] => {
  // Dynamically import all files in the learning-tree-nodes directory
  const files = fs.readdirSync(directoryPath);
  const fileDataList: nodeData[] = [];

  for (const fileName of files) {
    const fullPath = path.join(directoryPath, fileName);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Extract the link from content using regex
      const linkMatch = content.match(/link="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : '';

      // Extract the title from content using regex
      const titleMatch = content.match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : '';

      // Extract the section from the file name
      const section = fileName.split('-')[0];

      console.log("Link to Tree: " + link);
      console.log("Title: " + title);

      fileDataList.push({
        title: title,
        section: section,
        linkToTree: link,
      });
    }
  }

  return fileDataList;
}

/**
 * The LeftPanel component displays the left panel of the library page.
 * @param {LeftPanelProps} props - The props to be passed to the LeftPanel component.
 * @returns {JSX.Element} The LeftPanel component.
 */
const Legend = (props: LeftPanelProps) => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
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
        // pass
      });
  }, []);

  /**
   * The LeftPanel component.
   */
  return (
    <div className="left-panel">
      <h1 className="header">
        <a href="/library">Directory</a>
      </h1>
      <div className="navigation">
        <Button
          component={Link}
          to="/library?nav=Featured"
          startIcon={<AutoAwesomeIcon />}
        >
          Featured
        </Button>
        <Button
          component={Link}
          to="/library?nav=Research"
          startIcon={<ScienceIcon />}
        >
          Research
        </Button>
        <Button
          component={Link}
          to="/library?nav=Articles"
          startIcon={<DescriptionIcon />}
          onClick={() => props.forceRefresh("Articles")}
        >
          Articles
        </Button>
        <Button
          component={Link}
          to="/library?nav=Workshops"
          startIcon={<ConstructionIcon />}
          onClick={() => props.forceRefresh("Workshops")}
        >
          Workshops
        </Button>
        {articlesDropdown && <div>{categories}</div>}
        <Button component={Link} to="/library?nav=Videos" startIcon={<Movie />}>
          Videos
        </Button>
        <Button component={Link} to="/library?nav=Competitions" startIcon={<EmojiEventsIcon />}>
          Competitions
        </Button>
        {/* <Button
          component={Link}
          to="/library?nav=Favorites"
          startIcon={<Favorite />}
        >
          Favorites
        </Button> */}
        <Divider
          sx={{ borderColor: "white", margin: "1rem 1rem" }}
          aria-hidden="true"
        />
        <Button
          component={Link}
          to="https://forms.office.com/r/STYXQ1FPMn"
          startIcon={<NoteAddIcon />}
        >
          Submit
        </Button>
        {/* <Button
          component={Link}
          to="/About.html"
          startIcon={<HelpIcon />}
        >
          Help
        </Button> */}
      </div>
    </div>
  );
};

export default Legend;
