inputDataCSV = "C:/Users/mackey/Documents/GitHub/benmap/assets/data/data.csv"
outputDataCSV = "C:/Users/mackey/Documents/GitHub/benmap/assets/data/data_out.csv"

with open(inputDataCSV, 'r') as inputF:
    with open(outputDataCSV, 'w') as outputF:
        for line in inputF:
            if line.endswith("Laboratory,,,\n"):
                splitLine = line.split(',')
                splitLine[2] = "Laboratory"
                line = ','.join(splitLine)
            elif line.endswith("Manufacturing/Industrial Plant,,,\n"):
                splitLine = line.split(',')
                splitLine[2] = "Industrial Plant"
                line = ','.join(splitLine)
            outputF.write(line)
