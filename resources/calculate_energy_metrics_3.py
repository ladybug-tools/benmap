
def open_file(fname):
    try:
        fin = open(fname, 'r')
        data = fin.readlines()
        fin.close()
        return data
    except:
        print 'File %s not opened' % fname
        return False

csvfile = "C:\\Users\\vasanthakumars\\Documents\\GitHub\\BEnMap\\resources\\Energy_Reporting_Data_Sept2016_CLEAM.csv"
lstofbld = open_file(csvfile)
properties = lstofbld.pop(0)
print properties
        

for i,bld in enumerate(lstofbld):
    if True:#i > 4:#abs(i-5.)<0.001:
        lstofinfo = bld.split(',')
        type,use,gfa,eui,energy_star_score,energy_star_cert = 'err','err','err','err','err','err'
        type = lstofinfo[2]
        use = lstofinfo[10]
        gfa = lstofinfo[5]
        eui = lstofinfo[6]
        energy_star_score = lstofinfo[7]
        energy_star_cert = lstofinfo[8]
        year_built = lstofinfo[10]
    
        # Identify the building type
        chktype = False
        
        if "Education" in type:
            mediansrceui = 144.
        elif "College" in type:
            mediansiteeui = 244.
        elif "Food Sales" in type:
            mediansiteeui = 570.
        elif "Convenience" in type:
            mediansiteeui = 657.
        elif "Food Service" in type:
            mediansiteeui = 575. 
        elif "Restaurant" in type:
            mediansiteeui = 434.
        elif "Fast Food" in type:
            mediansiteeui = 1170. 
        elif "Lodging" in type:
            mediansiteeui = 163.
        elif "Mall" in type:
            mediansiteeui = 247. 
        elif "Outpatient" in type:
            mediansiteeui = 163.
        elif "Clinic" in type:
            mediansiteeui = 194.
        elif "Public Assembly" in type:
            mediansiteeui = 89.
        elif "Entertainment" in type:
            mediansiteeui = 94.
        elif "Library" in type:
            mediansiteeui = 246.
        elif "Recreation" in type:
            mediansiteeui = 100.
        elif "Social" in type:
            mediansiteeui = 71.
        elif "Public Order and Safety" in type:
            mediansiteeui = 161.
        elif "Police Station" in type:
            mediansiteeui = 146.
        elif "Vehicle Repair" in type:
            mediansiteeui = 96.
        elif "Storage" in type or "Shipping" in type:
            mediansiteeui = 28.
        elif "Retail Store" in type:
            mediansiteeui = 139.
        else:
            mediansiteeui = 127.
        
        print '--'
        print lstofinfo
        print 'median', mediansiteeui
        print 'energy', eui
        print 'year', year_built
        
        try:
            mediansiteeui = float(mediansiteeui)
            if year_built < 2010:
                print year_built
                energy_target = float(mediansiteeui) * 0.3
            else:
                energy_target = float(mediansiteeui) * 0.8
        except Exception as e:
            energy_target = 'missing eui data target'
            print str(e)
        
        
        print 'etarg', energy_target
            