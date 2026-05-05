import AstalHyprland from "gi://AstalHyprland"                                          
  import GObject from "gi://GObject"                                                                                            
  import { createBinding, createExternal } from "ags"                                                                           
                                                                                                                                
  const { connect, disconnect } = GObject.Object.prototype                                                                      
                                                                                                                                
  export const hyprland = AstalHyprland.get_default()                                                                           
                  
  export const workspaces = createBinding(hyprland, "workspaces")                                                               
  export const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")
                                                                                                                                
  export const clients = createExternal(hyprland.get_clients(), (set) => {                                                      
    const update = () => set([...hyprland.get_clients()])
    const watchers = new Map<AstalHyprland.Client, number>()                                                                    
                  
    function watch(c: AstalHyprland.Client) {                                                                                   
      if (!watchers.has(c))
        watchers.set(c, connect.call(c, "notify::workspace", update))                                                           
    }                                                                                                                           
  
    hyprland.get_clients().forEach(watch)                                                                                       
                  
    const id = connect.call(hyprland, "notify::clients", () => {                                                                
      const current = hyprland.get_clients()
      for (const [c, sigId] of watchers) {                                                                                      
        if (!current.includes(c)) {                                                                                             
          disconnect.call(c, sigId)
          watchers.delete(c)                                                                                                    
        }         
      }
      current.forEach(watch)
      update()                                                                                                                  
    })
                                                                                                                                
    return () => {
      disconnect.call(hyprland, id)
      watchers.forEach((sigId, c) => disconnect.call(c, sigId))
      watchers.clear()
    }                                                                                                                           
  })
                                                                                                                                
  export function dispatch(cmd: string, arg: string) {
    hyprland.dispatch(cmd, arg)
  }