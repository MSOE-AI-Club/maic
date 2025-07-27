from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from learning_tree.backend import LearningTree

router = APIRouter()

path_to_nodes = "learning_tree/learning-tree-nodes"

@router.get("/", description="Learning Tree nodes")
async def get_learning_tree():
    try:
        learning_tree = LearningTree(path=path_to_nodes)
        return JSONResponse(content=learning_tree.builder())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while generating the learning tree: {str(e)}")

@router.get("/sections", description="Get learning tree sections for navigation")
async def get_learning_tree_sections():
    try:
        learning_tree = LearningTree(path=path_to_nodes)
        sections = learning_tree.get_sections()
        return JSONResponse(content={"sections": sections})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while getting sections: {str(e)}")

@router.get("/all-nodes", description="Get data for all nodes in the learning tree")
async def get_learning_tree_nodes():
    try:
        learning_tree = LearningTree(path=path_to_nodes)
        nodes = learning_tree.get_all_nodes()
        return JSONResponse(content={"nodes": nodes})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while getting nodes: {str(e)}")